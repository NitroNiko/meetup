const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const { syncTeamAdjustmentPoints } = require("../db");
const {
  badRequest,
  notFound,
  parseId,
  trimRequired,
  parseInteger,
  parseHexColor,
  parseOptionalNote,
} = require("./helpers");

const TEAM_COLOR_PRESETS = [
  "#2E6EA7",
  "#E12914",
  "#5ABC8E",
  "#F5C161",
  "#6B5B95",
  "#1B3F61",
  "#0D9488",
  "#EA580C",
];

function createTeamsRouter(db) {
  const router = express.Router();

  const listTeamsStmt = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.color,
      t.created_at,
      t.adjustment_points,
      COALESCE(SUM(CASE WHEN g.status = 'completed' THEN s.points ELSE 0 END), 0) AS game_points,
      COALESCE(SUM(CASE WHEN g.status = 'completed' THEN s.points ELSE 0 END), 0)
        + t.adjustment_points AS total_points
    FROM teams t
    LEFT JOIN score_entries s ON s.team_id = t.id
    LEFT JOIN games g ON g.id = s.game_id
    GROUP BY t.id
    ORDER BY t.name COLLATE NOCASE
  `);

  const membersByTeamStmt = db.prepare(`
    SELECT id, team_id, name, created_at
    FROM members
    WHERE team_id = ?
    ORDER BY name COLLATE NOCASE
  `);

  const correctionsByTeamStmt = db.prepare(`
    SELECT id, team_id, points, note, created_by, created_at, updated_at
    FROM score_corrections
    WHERE team_id = ?
    ORDER BY created_at DESC, id DESC
  `);

  const getTeamStmt = db.prepare(
    "SELECT id, name, color, created_at, adjustment_points FROM teams WHERE id = ?"
  );
  const gamePointsStmt = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN g.status = 'completed' THEN s.points ELSE 0 END), 0) AS game_points
    FROM score_entries s
    JOIN games g ON g.id = s.game_id
    WHERE s.team_id = ?
  `);
  const insertTeamStmt = db.prepare(
    "INSERT INTO teams (name, color) VALUES (?, ?)"
  );
  const updateTeamStmt = db.prepare(
    "UPDATE teams SET name = ?, color = ? WHERE id = ?"
  );
  const deleteTeamStmt = db.prepare("DELETE FROM teams WHERE id = ?");
  const insertMemberStmt = db.prepare(
    "INSERT INTO members (team_id, name) VALUES (?, ?)"
  );
  const deleteMemberStmt = db.prepare(
    "DELETE FROM members WHERE id = ? AND team_id = ?"
  );
  const insertCorrectionStmt = db.prepare(`
    INSERT INTO score_corrections (team_id, points, note, created_by)
    VALUES (?, ?, ?, ?)
  `);

  function nextDefaultColor() {
    const count = db.prepare("SELECT COUNT(*) AS count FROM teams").get().count;
    return TEAM_COLOR_PRESETS[count % TEAM_COLOR_PRESETS.length];
  }

  function enrichTeam(team) {
    if (!team) {
      return null;
    }
    const gamePoints =
      team.game_points != null
        ? Number(team.game_points) || 0
        : Number(gamePointsStmt.get(team.id).game_points) || 0;
    const adjustmentPoints = Number(team.adjustment_points) || 0;
    return {
      id: team.id,
      name: team.name,
      color: team.color || "#2E6EA7",
      created_at: team.created_at,
      game_points: gamePoints,
      adjustment_points: adjustmentPoints,
      total_points: gamePoints + adjustmentPoints,
      members: membersByTeamStmt.all(team.id),
      corrections: correctionsByTeamStmt.all(team.id),
    };
  }

  router.get("/meta/colors", (_req, res) => {
    res.json({ presets: TEAM_COLOR_PRESETS });
  });

  router.get("/", (_req, res) => {
    res.json(listTeamsStmt.all().map(enrichTeam));
  });

  router.get("/:id", (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Team-ID.");
    }
    const team = getTeamStmt.get(id);
    if (!team) {
      return notFound(res, "Team nicht gefunden.");
    }
    return res.json(enrichTeam(team));
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const name = trimRequired(req.body?.name, "Teamname");
      const color = req.body?.color
        ? parseHexColor(req.body.color)
        : nextDefaultColor();
      const members = Array.isArray(req.body?.members) ? req.body.members : [];

      const create = db.transaction(() => {
        const result = insertTeamStmt.run(name, color);
        const teamId = result.lastInsertRowid;
        for (const member of members) {
          const memberName = String(member?.name ?? member ?? "").trim();
          if (memberName) {
            insertMemberStmt.run(teamId, memberName);
          }
        }
        return teamId;
      });

      return res.status(201).json(enrichTeam(getTeamStmt.get(create())));
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return badRequest(res, "Ein Team mit diesem Namen existiert bereits.");
      }
      return badRequest(res, error.message);
    }
  });

  router.put("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Team-ID.");
    }
    const existing = getTeamStmt.get(id);
    if (!existing) {
      return notFound(res, "Team nicht gefunden.");
    }

    try {
      const name = trimRequired(req.body?.name ?? existing.name, "Teamname");
      const color = req.body?.color
        ? parseHexColor(req.body.color)
        : existing.color || "#2E6EA7";
      updateTeamStmt.run(name, color, id);
      return res.json(enrichTeam(getTeamStmt.get(id)));
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return badRequest(res, "Ein Team mit diesem Namen existiert bereits.");
      }
      return badRequest(res, error.message);
    }
  });

  /**
   * Compatibility endpoint: creates a score_corrections row (+ optional note)
   * and keeps teams.adjustment_points in sync.
   */
  router.put("/:id/points", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Team-ID.");
    }
    const team = getTeamStmt.get(id);
    if (!team) {
      return notFound(res, "Team nicht gefunden.");
    }

    try {
      const hasTotal =
        req.body?.total_points !== undefined && req.body?.total_points !== "";
      const hasDelta = req.body?.delta !== undefined && req.body?.delta !== "";
      if (hasTotal === hasDelta) {
        return badRequest(
          res,
          "Bitte genau eines von total_points oder delta angeben."
        );
      }

      const gamePoints = Number(gamePointsStmt.get(id).game_points) || 0;
      const currentAdjustment = Number(team.adjustment_points) || 0;
      let delta;
      if (hasTotal) {
        const totalPoints = parseInteger(req.body.total_points, "total_points");
        delta = totalPoints - (gamePoints + currentAdjustment);
      } else {
        delta = parseInteger(req.body.delta, "delta");
      }

      if (delta === 0) {
        return res.json(enrichTeam(getTeamStmt.get(id)));
      }

      const note = parseOptionalNote(req.body?.note);
      const createdBy = String(req.body?.created_by ?? "Admin").trim() || "Admin";

      insertCorrectionStmt.run(id, delta, note, createdBy);
      syncTeamAdjustmentPoints(db, id);
      return res.json(enrichTeam(getTeamStmt.get(id)));
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return badRequest(res, "Ungültige Team-ID.");
    }
    const result = deleteTeamStmt.run(id);
    if (result.changes === 0) {
      return notFound(res, "Team nicht gefunden.");
    }
    return res.json({ ok: true });
  });

  router.post("/:id/members", requireAdmin, (req, res) => {
    const teamId = parseId(req.params.id);
    if (!teamId) {
      return badRequest(res, "Ungültige Team-ID.");
    }
    if (!getTeamStmt.get(teamId)) {
      return notFound(res, "Team nicht gefunden.");
    }

    try {
      const name = trimRequired(req.body?.name, "Mitgliedsname");
      const result = insertMemberStmt.run(teamId, name);
      const member = db
        .prepare(
          "SELECT id, team_id, name, created_at FROM members WHERE id = ?"
        )
        .get(result.lastInsertRowid);
      return res.status(201).json(member);
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  router.delete("/:teamId/members/:memberId", requireAdmin, (req, res) => {
    const teamId = parseId(req.params.teamId);
    const memberId = parseId(req.params.memberId);
    if (!teamId || !memberId) {
      return badRequest(res, "Ungültige ID.");
    }
    const result = deleteMemberStmt.run(memberId, teamId);
    if (result.changes === 0) {
      return notFound(res, "Mitglied nicht gefunden.");
    }
    return res.json({ ok: true });
  });

  return router;
}

module.exports = { createTeamsRouter, TEAM_COLOR_PRESETS };
