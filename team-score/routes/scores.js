const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  badRequest,
  notFound,
  parseId,
  parseNonNegativeInt,
  parseDate,
  todayDateString,
} = require("./helpers");

function createScoresRouter(db) {
  const router = express.Router();

  const getTeamStmt = db.prepare("SELECT id FROM teams WHERE id = ?");
  const getGameStmt = db.prepare("SELECT id FROM games WHERE id = ?");
  const getScoreStmt = db.prepare(`
    SELECT
      s.id, s.game_id, s.team_id, s.points, s.note, s.awarded_at, s.score_date,
      t.name AS team_name, t.color AS team_color
    FROM score_entries s
    JOIN teams t ON t.id = s.team_id
    WHERE s.id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO score_entries (game_id, team_id, points, note, awarded_at, score_date)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(game_id, team_id, score_date) DO UPDATE SET
      points = excluded.points,
      note = excluded.note,
      awarded_at = datetime('now')
  `);

  const deleteStmt = db.prepare("DELETE FROM score_entries WHERE id = ?");

  router.put("/", requireAdmin, (req, res) => {
    const gameId = parseId(req.body?.game_id);
    const teamId = parseId(req.body?.team_id);
    if (!gameId || !teamId) {
      return badRequest(res, "game_id und team_id sind erforderlich.");
    }
    if (!getGameStmt.get(gameId)) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    if (!getTeamStmt.get(teamId)) {
      return notFound(res, "Team nicht gefunden.");
    }

    try {
      const points = parseNonNegativeInt(req.body?.points, "points");
      const note = String(req.body?.note ?? "").trim();
      const scoreDate = req.body?.score_date
        ? parseDate(req.body.score_date, "score_date")
        : todayDateString();

      upsertStmt.run(gameId, teamId, points, note, scoreDate);

      const score = db
        .prepare(
          `SELECT s.id, s.game_id, s.team_id, s.points, s.note, s.awarded_at, s.score_date,
                  t.name AS team_name, t.color AS team_color
           FROM score_entries s
           JOIN teams t ON t.id = s.team_id
           WHERE s.game_id = ? AND s.team_id = ? AND s.score_date = ?`
        )
        .get(gameId, teamId, scoreDate);

      return res.json(score);
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Score-ID.");
    }
    if (!getScoreStmt.get(id)) {
      return notFound(res, "Punkteintrag nicht gefunden.");
    }
    deleteStmt.run(id);
    return res.json({ ok: true });
  });

  return router;
}

function createLeaderboardRouter(db) {
  const router = express.Router();

  const membersStmt = db.prepare(`
    SELECT id, name FROM members WHERE team_id = ? ORDER BY name COLLATE NOCASE
  `);

  const totalLeaderboardStmt = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.color,
      t.adjustment_points,
      COALESCE(SUM(s.points), 0) AS game_points,
      COALESCE(SUM(s.points), 0) + t.adjustment_points AS total_points,
      COUNT(s.id) AS scored_games
    FROM teams t
    LEFT JOIN score_entries s ON s.team_id = t.id
    GROUP BY t.id
    ORDER BY total_points DESC, t.name COLLATE NOCASE
  `);

  const dailyLeaderboardStmt = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.color,
      0 AS adjustment_points,
      COALESCE(SUM(s.points), 0) AS game_points,
      COALESCE(SUM(s.points), 0) AS total_points,
      COUNT(s.id) AS scored_games
    FROM teams t
    LEFT JOIN score_entries s
      ON s.team_id = t.id AND s.score_date = ?
    GROUP BY t.id
    ORDER BY total_points DESC, t.name COLLATE NOCASE
  `);

  router.get("/", (req, res) => {
    try {
      const mode = String(req.query.mode || "total").toLowerCase();
      if (mode !== "total" && mode !== "daily") {
        return badRequest(res, "mode muss total oder daily sein.");
      }

      const date =
        mode === "daily"
          ? parseDate(req.query.date || todayDateString(), "date")
          : null;

      const rows =
        mode === "daily"
          ? dailyLeaderboardStmt.all(date)
          : totalLeaderboardStmt.all();

      return res.json({
        mode,
        date,
        teams: rows.map((row, index) => ({
          rank: index + 1,
          id: row.id,
          name: row.name,
          color: row.color || "#2E6EA7",
          game_points: Number(row.game_points) || 0,
          adjustment_points: Number(row.adjustment_points) || 0,
          total_points: Number(row.total_points) || 0,
          scored_games: Number(row.scored_games) || 0,
          members: membersStmt.all(row.id),
        })),
      });
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  return router;
}

module.exports = { createScoresRouter, createLeaderboardRouter };
