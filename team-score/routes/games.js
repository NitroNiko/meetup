const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  badRequest,
  notFound,
  parseId,
  trimRequired,
  parseNonNegativeInt,
} = require("./helpers");

function createGamesRouter(db) {
  const router = express.Router();

  const listGamesStmt = db.prepare(`
    SELECT id, title, description, status, max_points, created_at, completed_at
    FROM games
    WHERE (? IS NULL OR status = ?)
    ORDER BY
      CASE status WHEN 'open' THEN 0 ELSE 1 END,
      created_at DESC
  `);

  const getGameStmt = db.prepare(`
    SELECT id, title, description, status, max_points, created_at, completed_at
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
      t.name AS team_name
    FROM score_entries s
    JOIN teams t ON t.id = s.team_id
    WHERE s.game_id = ?
    ORDER BY s.points DESC, t.name COLLATE NOCASE
  `);

  const insertGameStmt = db.prepare(`
    INSERT INTO games (title, description, status, max_points, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateGameStmt = db.prepare(`
    UPDATE games
    SET title = ?, description = ?, status = ?, max_points = ?, completed_at = ?
    WHERE id = ?
  `);

  const deleteGameStmt = db.prepare("DELETE FROM games WHERE id = ?");

  function enrichGame(game) {
    if (!game) {
      return null;
    }
    return {
      ...game,
      scores: scoresForGameStmt.all(game.id),
    };
  }

  router.get("/", (req, res) => {
    const status = req.query.status ? String(req.query.status) : null;
    if (status && status !== "open" && status !== "completed") {
      return badRequest(res, "status muss open oder completed sein.");
    }
    const games = listGamesStmt.all(status, status).map(enrichGame);
    return res.json(games);
  });

  router.get("/:id", (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Spiel-ID.");
    }
    const game = enrichGame(getGameStmt.get(id));
    if (!game) {
      return notFound(res, "Spiel nicht gefunden.");
    }
    return res.json(game);
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const title = trimRequired(req.body?.title, "Titel");
      const description = String(req.body?.description ?? "").trim();
      const status = req.body?.status === "completed" ? "completed" : "open";
      let maxPoints = null;
      if (req.body?.max_points !== undefined && req.body?.max_points !== null && req.body?.max_points !== "") {
        maxPoints = parseNonNegativeInt(req.body.max_points, "max_points");
      }
      const completedAt = status === "completed" ? new Date().toISOString() : null;
      const result = insertGameStmt.run(title, description, status, maxPoints, completedAt);
      return res.status(201).json(enrichGame(getGameStmt.get(result.lastInsertRowid)));
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
        req.body?.status === "completed" || req.body?.status === "open"
          ? req.body.status
          : existing.status;

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
      } else if (status === "open") {
        completedAt = null;
      }

      updateGameStmt.run(title, description, status, maxPoints, completedAt, id);
      return res.json(enrichGame(getGameStmt.get(id)));
    } catch (error) {
      return badRequest(res, error.message);
    }
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
