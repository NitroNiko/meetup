const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  badRequest,
  notFound,
  parseId,
  parseNonNegativeInt,
} = require("./helpers");

function createScoresRouter(db) {
  const router = express.Router();

  const getTeamStmt = db.prepare("SELECT id FROM teams WHERE id = ?");
  const getGameStmt = db.prepare("SELECT id FROM games WHERE id = ?");
  const getScoreStmt = db.prepare(`
    SELECT
      s.id, s.game_id, s.team_id, s.points, s.note, s.awarded_at,
      t.name AS team_name
    FROM score_entries s
    JOIN teams t ON t.id = s.team_id
    WHERE s.id = ?
  `);

  const upsertStmt = db.prepare(`
    INSERT INTO score_entries (game_id, team_id, points, note, awarded_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(game_id, team_id) DO UPDATE SET
      points = excluded.points,
      note = excluded.note,
      awarded_at = datetime('now')
  `);

  const deleteStmt = db.prepare("DELETE FROM score_entries WHERE id = ?");

  // Award or update points for a team in a game
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
      upsertStmt.run(gameId, teamId, points, note);

      const score = db
        .prepare(
          `SELECT s.id, s.game_id, s.team_id, s.points, s.note, s.awarded_at, t.name AS team_name
           FROM score_entries s
           JOIN teams t ON t.id = s.team_id
           WHERE s.game_id = ? AND s.team_id = ?`
        )
        .get(gameId, teamId);

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

  const leaderboardStmt = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.adjustment_points,
      COALESCE(SUM(s.points), 0) AS game_points,
      COALESCE(SUM(s.points), 0) + t.adjustment_points AS total_points,
      COUNT(s.id) AS scored_games
    FROM teams t
    LEFT JOIN score_entries s ON s.team_id = t.id
    GROUP BY t.id
    ORDER BY total_points DESC, t.name COLLATE NOCASE
  `);

  const membersStmt = db.prepare(`
    SELECT id, name FROM members WHERE team_id = ? ORDER BY name COLLATE NOCASE
  `);

  router.get("/", (_req, res) => {
    const rows = leaderboardStmt.all().map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.name,
      game_points: Number(row.game_points) || 0,
      adjustment_points: Number(row.adjustment_points) || 0,
      total_points: Number(row.total_points) || 0,
      scored_games: Number(row.scored_games) || 0,
      members: membersStmt.all(row.id),
    }));
    res.json(rows);
  });

  return router;
}

module.exports = { createScoresRouter, createLeaderboardRouter };
