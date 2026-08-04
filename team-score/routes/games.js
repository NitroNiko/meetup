const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  DEFAULT_SCORING_MODE,
  normalizeGameStatus,
  isLeaderboardEligibleStatus,
} = require("../lib/constants");
const { getWinnerMode } = require("../lib/settings");
const { sortScoreRowsByWinnerMode } = require("../lib/scoring");
const {
  computeJuryStandings,
  teamOrderFromStandings,
  validateRanking,
} = require("../lib/jury");
const { applyGameResults } = require("../lib/gameResults");
const {
  badRequest,
  notFound,
  parseId,
  trimRequired,
  parseNonNegativeInt,
  parseGameStatus,
  parseScoringMode,
  parseTeamIdList,
  parseDate,
  todayDateString,
} = require("./helpers");

function createGamesRouter(db) {
  const router = express.Router();

  const listGamesStmt = db.prepare(`
    SELECT id, title, description, status, scoring_mode, max_points,
           created_at, completed_at, evaluation_date
    FROM games
    WHERE (? IS NULL OR status = ?)
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'draft' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
      END,
      created_at DESC
  `);

  const getGameStmt = db.prepare(`
    SELECT id, title, description, status, scoring_mode, max_points,
           created_at, completed_at, evaluation_date
    FROM games WHERE id = ?
  `);

  const scoresForGameStmt = db.prepare(`
    SELECT
      s.id,
      s.game_id,
      s.team_id,
      s.points,
      s.note,
      s.awarded_at,
      s.score_date,
      t.name AS team_name,
      t.color AS team_color
    FROM score_entries s
    JOIN teams t ON t.id = s.team_id
    WHERE s.game_id = ?
  `);

  const allTeamsStmt = db.prepare(
    "SELECT id, name, color FROM teams ORDER BY name COLLATE NOCASE"
  );

  const placementStmt = db.prepare(`
    SELECT p.team_id, p.place, t.name AS team_name, t.color AS team_color
    FROM placement_rankings p
    JOIN teams t ON t.id = p.team_id
    WHERE p.game_id = ?
    ORDER BY p.place ASC
  `);

  const clearPlacementStmt = db.prepare(
    "DELETE FROM placement_rankings WHERE game_id = ?"
  );
  const insertPlacementStmt = db.prepare(`
    INSERT INTO placement_rankings (game_id, team_id, place) VALUES (?, ?, ?)
  `);

  const ballotsStmt = db.prepare(`
    SELECT
      b.id, b.game_id, b.juror_name, b.evaluation_date,
      b.submitted_at, b.updated_at, b.deleted_at
    FROM jury_ballots b
    WHERE b.game_id = ? AND b.deleted_at IS NULL
    ORDER BY b.updated_at DESC
  `);
  const ballotItemsStmt = db.prepare(`
    SELECT i.team_id, i.place, t.name AS team_name, t.color AS team_color
    FROM jury_ballot_items i
    JOIN teams t ON t.id = i.team_id
    WHERE i.ballot_id = ?
    ORDER BY i.place ASC
  `);
  const getActiveBallotByNameStmt = db.prepare(`
    SELECT id, game_id, juror_name, evaluation_date
    FROM jury_ballots
    WHERE game_id = ? AND deleted_at IS NULL AND juror_name = ? COLLATE NOCASE
  `);
  const getBallotByIdStmt = db.prepare(`
    SELECT id, game_id, juror_name, evaluation_date, deleted_at
    FROM jury_ballots WHERE id = ?
  `);
  const insertBallotStmt = db.prepare(`
    INSERT INTO jury_ballots (game_id, juror_name, evaluation_date, submitted_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `);
  const updateBallotStmt = db.prepare(`
    UPDATE jury_ballots
    SET juror_name = ?, evaluation_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  const softDeleteBallotStmt = db.prepare(`
    UPDATE jury_ballots
    SET deleted_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND deleted_at IS NULL
  `);
  const clearBallotItemsStmt = db.prepare(
    "DELETE FROM jury_ballot_items WHERE ballot_id = ?"
  );
  const insertBallotItemStmt = db.prepare(`
    INSERT INTO jury_ballot_items (ballot_id, team_id, place) VALUES (?, ?, ?)
  `);

  const insertGameStmt = db.prepare(`
    INSERT INTO games (title, description, status, scoring_mode, max_points, completed_at, evaluation_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const updateGameStmt = db.prepare(`
    UPDATE games
    SET title = ?, description = ?, status = ?, scoring_mode = ?,
        max_points = ?, completed_at = ?, evaluation_date = ?
    WHERE id = ?
  `);

  const deleteGameStmt = db.prepare("DELETE FROM games WHERE id = ?");

  function loadJuryPayload(gameId) {
    const teams = allTeamsStmt.all();
    const ballots = ballotsStmt.all(gameId).map((ballot) => ({
      ...ballot,
      rankings: ballotItemsStmt.all(ballot.id),
    }));
    const standingsPayload = computeJuryStandings(
      ballots,
      teams,
      ballots.length
    );
    return {
      ballots,
      standings: standingsPayload.standings,
      submitted: standingsPayload.submitted,
      expected: standingsPayload.submitted,
    };
  }

  function enrichGame(game, { includeAdmin = false } = {}) {
    if (!game) {
      return null;
    }

    const winnerMode = getWinnerMode(db);
    const scores = sortScoreRowsByWinnerMode(
      scoresForGameStmt.all(game.id),
      winnerMode
    );

    const countsForLeaderboard = isLeaderboardEligibleStatus(game.status);
    const base = {
      ...game,
      winnerMode,
      counts_for_leaderboard: countsForLeaderboard,
      scores,
      placement: placementStmt.all(game.id),
    };

    if (includeAdmin || game.scoring_mode === "jury") {
      const jury = loadJuryPayload(game.id);
      if (includeAdmin) {
        base.jury = jury;
      } else if (game.status === "completed") {
        base.jury = {
          submitted: jury.submitted,
          expected: jury.expected,
          standings: jury.standings,
        };
      }
    }

    return base;
  }

  function syncResultsFromCurrentRanking(game, scoreDate) {
    const date = scoreDate || game.evaluation_date || todayDateString();
    if (game.scoring_mode === "placement") {
      const placement = placementStmt.all(game.id);
      if (!placement.length) {
        return null;
      }
      const teamIds = placement.map((row) => row.team_id);
      return applyGameResults(db, game, teamIds, {
        winnerMode: getWinnerMode(db),
        scoreDate: date,
        note: "Platzierungswertung",
      });
    }

    const jury = loadJuryPayload(game.id);
    const teamIds = teamOrderFromStandings(jury.standings);
    if (!teamIds.length) {
      return null;
    }
    return applyGameResults(db, game, teamIds, {
      winnerMode: getWinnerMode(db),
      scoreDate: date,
      note: "Jurorenwertung",
    });
  }

  router.get("/", (req, res) => {
    let status = null;
    if (req.query.status) {
      try {
        status = parseGameStatus(req.query.status, { required: true });
      } catch (error) {
        return badRequest(res, error.message);
      }
    }
    const includeAdmin = Boolean(req.query.admin === "1");
    const games = listGamesStmt
      .all(status, status)
      .map((game) => enrichGame(game, { includeAdmin }));
    return res.json(games);
  });

  router.get("/:id", (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const includeAdmin = Boolean(req.query.admin === "1");
    const game = enrichGame(getGameStmt.get(id), { includeAdmin });
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    return res.json(game);
  });

  router.get("/:id/standings", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const game = getGameStmt.get(id);
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    if (game.scoring_mode !== "jury") {
      return badRequest(res, "Zwischenstand ist nur im Jurorenmodus verfügbar.");
    }
    const jury = loadJuryPayload(id);
    return res.json({
      game_id: id,
      scoring_mode: game.scoring_mode,
      ...jury,
    });
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const title = trimRequired(req.body?.title, "Titel");
      const description = String(req.body?.description ?? "").trim();
      const status = parseGameStatus(req.body?.status) || "active";
      const scoringMode =
        parseScoringMode(req.body?.scoring_mode) || DEFAULT_SCORING_MODE;
      let maxPoints = null;
      if (
        req.body?.max_points !== undefined &&
        req.body?.max_points !== null &&
        req.body?.max_points !== ""
      ) {
        maxPoints = parseNonNegativeInt(req.body.max_points, "max_points");
      }
      const completedAt = status === "completed" ? new Date().toISOString() : null;
      const evaluationDate = req.body?.evaluation_date
        ? parseDate(req.body.evaluation_date, "evaluation_date")
        : todayDateString();
      const result = insertGameStmt.run(
        title,
        description,
        status,
        scoringMode,
        maxPoints,
        completedAt,
        evaluationDate
      );
      return res
        .status(201)
        .json(enrichGame(getGameStmt.get(result.lastInsertRowid), { includeAdmin: true }));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.put("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const existing = getGameStmt.get(id);
    if (!existing) {
      return notFound(res, "Spiel nicht gefunden.");
    }

    try {
      const title = trimRequired(req.body?.title ?? existing.title, "Titel");
      const description =
        req.body?.description !== undefined
          ? String(req.body.description).trim()
          : existing.description;
      const status =
        parseGameStatus(req.body?.status) || normalizeGameStatus(existing.status);
      const scoringMode =
        parseScoringMode(req.body?.scoring_mode) || existing.scoring_mode;

      let maxPoints = existing.max_points;
      if (req.body?.max_points !== undefined) {
        maxPoints =
          req.body.max_points === null || req.body.max_points === ""
            ? null
            : parseNonNegativeInt(req.body.max_points, "max_points");
      }

      let completedAt = existing.completed_at;
      if (status === "completed" && existing.status !== "completed") {
        completedAt = new Date().toISOString();
      } else if (status !== "completed") {
        completedAt = null;
      }

      const evaluationDate = req.body?.evaluation_date
        ? parseDate(req.body.evaluation_date, "evaluation_date")
        : existing.evaluation_date || todayDateString();

      updateGameStmt.run(
        title,
        description,
        status,
        scoringMode,
        maxPoints,
        completedAt,
        evaluationDate,
        id
      );

      const updated = getGameStmt.get(id);
      if (status === "completed") {
        syncResultsFromCurrentRanking(updated, evaluationDate);
      }

      return res.json(enrichGame(getGameStmt.get(id), { includeAdmin: true }));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.put("/:id/placement", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const game = getGameStmt.get(id);
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    if (game.scoring_mode !== "placement") {
      return badRequest(res, "Platzierungswertung ist für dieses Spiel nicht aktiv.");
    }

    try {
      const teamIds = parseTeamIdList(req.body?.team_ids);
      const teams = allTeamsStmt.all();
      validateRanking(
        teamIds,
        teams.map((team) => team.id)
      );
      const evaluationDate = req.body?.evaluation_date
        ? parseDate(req.body.evaluation_date, "evaluation_date")
        : todayDateString();

      const save = db.transaction(() => {
        clearPlacementStmt.run(id);
        teamIds.forEach((teamId, index) => {
          insertPlacementStmt.run(id, teamId, index + 1);
        });
        db.prepare("UPDATE games SET evaluation_date = ? WHERE id = ?").run(
          evaluationDate,
          id
        );
        applyGameResults(db, game, teamIds, {
          winnerMode: getWinnerMode(db),
          scoreDate: evaluationDate,
          note: "Platzierungswertung",
        });
      });
      save();

      return res.json(enrichGame(getGameStmt.get(id), { includeAdmin: true }));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.put("/:id/jury-rankings", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const game = getGameStmt.get(id);
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    if (game.scoring_mode !== "jury") {
      return badRequest(res, "Jurorenwertung ist für dieses Spiel nicht aktiv.");
    }

    try {
      const jurorName = trimRequired(req.body?.juror_name, "Juror");
      const teamIds = parseTeamIdList(req.body?.team_ids);
      const teams = allTeamsStmt.all();
      validateRanking(
        teamIds,
        teams.map((team) => team.id)
      );
      const evaluationDate = req.body?.evaluation_date
        ? parseDate(req.body.evaluation_date, "evaluation_date")
        : todayDateString();

      let updatedExisting = false;
      const save = db.transaction(() => {
        let ballot = getActiveBallotByNameStmt.get(id, jurorName);
        if (!ballot) {
          const created = insertBallotStmt.run(id, jurorName, evaluationDate);
          ballot = { id: created.lastInsertRowid };
          updatedExisting = false;
        } else {
          updateBallotStmt.run(jurorName, evaluationDate, ballot.id);
          updatedExisting = true;
        }
        clearBallotItemsStmt.run(ballot.id);
        teamIds.forEach((teamId, index) => {
          insertBallotItemStmt.run(ballot.id, teamId, index + 1);
        });
        db.prepare("UPDATE games SET evaluation_date = ? WHERE id = ?").run(
          evaluationDate,
          id
        );
        return ballot.id;
      });
      const ballotId = save();

      if (game.status === "completed") {
        syncResultsFromCurrentRanking(getGameStmt.get(id), evaluationDate);
      }

      const jury = loadJuryPayload(id);
      return res.json({
        game_id: id,
        ballot_id: ballotId,
        updated: updatedExisting,
        ...jury,
        game: enrichGame(getGameStmt.get(id), { includeAdmin: true }),
      });
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.delete("/:id/jury-rankings/:ballotId", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    const ballotId = parseId(req.params.ballotId);
    if (!id || !ballotId) {
      return badRequest(res, "Ungültige ID.");
    }
    const game = getGameStmt.get(id);
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    const ballot = getBallotByIdStmt.get(ballotId);
    if (!ballot || ballot.game_id !== id || ballot.deleted_at) {
      return notFound(res, "Jurorenbewertung nicht gefunden.");
    }

    softDeleteBallotStmt.run(ballotId);

    if (game.status === "completed") {
      syncResultsFromCurrentRanking(
        getGameStmt.get(id),
        game.evaluation_date || todayDateString()
      );
    }

    return res.json({
      ok: true,
      game: enrichGame(getGameStmt.get(id), { includeAdmin: true }),
      ...loadJuryPayload(id),
    });
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const result = deleteGameStmt.run(id);
    if (result.changes === 0) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    return res.json({ ok: true });
  });

  return router;
}

module.exports = { createGamesRouter };
