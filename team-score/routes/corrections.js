const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const { syncTeamAdjustmentPoints } = require("../db");
const {
  badRequest,
  notFound,
  parseId,
  parseInteger,
  parseOptionalNote,
  trimRequired,
  parseDate,
  todayDateString,
} = require("./helpers");

function createCorrectionsRouter(db) {
  const router = express.Router();

  const listStmt = db.prepare(`
    SELECT
      c.id, c.team_id, c.points, c.note, c.created_by, c.created_at, c.updated_at,
      c.evaluation_date,
      t.name AS team_name, t.color AS team_color
    FROM score_corrections c
    JOIN teams t ON t.id = c.team_id
    WHERE (? IS NULL OR c.team_id = ?)
    ORDER BY c.evaluation_date DESC, c.created_at DESC, c.id DESC
  `);

  const getStmt = db.prepare(`
    SELECT
      c.id, c.team_id, c.points, c.note, c.created_by, c.created_at, c.updated_at,
      c.evaluation_date,
      t.name AS team_name, t.color AS team_color
    FROM score_corrections c
    JOIN teams t ON t.id = c.team_id
    WHERE c.id = ?
  `);

  const teamExistsStmt = db.prepare("SELECT id FROM teams WHERE id = ?");
  const insertStmt = db.prepare(`
    INSERT INTO score_corrections (team_id, points, note, created_by, evaluation_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE score_corrections
    SET points = ?, note = ?, created_by = ?, evaluation_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  const deleteStmt = db.prepare("DELETE FROM score_corrections WHERE id = ?");

  router.get("/", (req, res) => {
    const teamId = req.query.team_id ? parseId(req.query.team_id) : null;
    if (req.query.team_id && !teamId) {
      return badRequest(res, "Ungültige team_id.");
    }
    return res.json(listStmt.all(teamId, teamId));
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const teamId = parseId(req.body?.team_id);
      if (!teamId || !teamExistsStmt.get(teamId)) {
        return notFound(res, "Team nicht gefunden.");
      }
      const points = parseInteger(req.body?.points, "points");
      const note = parseOptionalNote(req.body?.note);
      const createdBy = trimRequired(
        req.body?.created_by || "Admin",
        "Bearbeiter"
      );
      const evaluationDate = req.body?.evaluation_date
        ? parseDate(req.body.evaluation_date, "evaluation_date")
        : todayDateString();

      const result = insertStmt.run(
        teamId,
        points,
        note,
        createdBy,
        evaluationDate
      );
      syncTeamAdjustmentPoints(db, teamId);
      return res.status(201).json(getStmt.get(result.lastInsertRowid));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.put("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Korrektur-ID.");
    }
    const existing = getStmt.get(id);
    if (!existing) {
      return notFound(res, "Korrektur nicht gefunden.");
    }

    try {
      const points =
        req.body?.points !== undefined
          ? parseInteger(req.body.points, "points")
          : existing.points;
      const note =
        req.body?.note !== undefined
          ? parseOptionalNote(req.body.note)
          : existing.note;
      const createdBy =
        req.body?.created_by !== undefined
          ? trimRequired(req.body.created_by, "Bearbeiter")
          : existing.created_by;
      const evaluationDate =
        req.body?.evaluation_date !== undefined
          ? parseDate(req.body.evaluation_date, "evaluation_date")
          : existing.evaluation_date || todayDateString();

      updateStmt.run(points, note, createdBy, evaluationDate, id);
      syncTeamAdjustmentPoints(db, existing.team_id);
      return res.json(getStmt.get(id));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Korrektur-ID.");
    }
    const existing = getStmt.get(id);
    if (!existing) {
      return notFound(res, "Korrektur nicht gefunden.");
    }
    deleteStmt.run(id);
    syncTeamAdjustmentPoints(db, existing.team_id);
    return res.json({ ok: true });
  });

  return router;
}

module.exports = { createCorrectionsRouter };
