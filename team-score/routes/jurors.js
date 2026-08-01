const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  badRequest,
  notFound,
  parseId,
  trimRequired,
} = require("./helpers");

function createJurorsRouter(db) {
  const router = express.Router();

  const listStmt = db.prepare(
    "SELECT id, name, created_at FROM jurors ORDER BY name COLLATE NOCASE"
  );
  const getStmt = db.prepare(
    "SELECT id, name, created_at FROM jurors WHERE id = ?"
  );
  const insertStmt = db.prepare("INSERT INTO jurors (name) VALUES (?)");
  const updateStmt = db.prepare("UPDATE jurors SET name = ? WHERE id = ?");
  const deleteStmt = db.prepare("DELETE FROM jurors WHERE id = ?");

  router.get("/", (_req, res) => {
    return res.json(listStmt.all());
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const name = trimRequired(req.body?.name, "Juror-Name");
      const result = insertStmt.run(name);
      return res.status(201).json(getStmt.get(result.lastInsertRowid));
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return badRequest(res, "Ein Juror mit diesem Namen existiert bereits.");
      }
      return badRequest(res, error.message);
    }
  });

  router.put("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Juror-ID.");
    }
    if (!getStmt.get(id)) {
      return notFound(res, "Juror nicht gefunden.");
    }
    try {
      const name = trimRequired(req.body?.name, "Juror-Name");
      updateStmt.run(name, id);
      return res.json(getStmt.get(id));
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return badRequest(res, "Ein Juror mit diesem Namen existiert bereits.");
      }
      return badRequest(res, error.message);
    }
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Juror-ID.");
    }
    const result = deleteStmt.run(id);
    if (result.changes === 0) {
      return notFound(res, "Juror nicht gefunden.");
    }
    return res.json({ ok: true });
  });

  return router;
}

module.exports = { createJurorsRouter };
