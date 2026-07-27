const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  badRequest,
  notFound,
  parseId,
  trimRequired,
} = require("./helpers");

function createTeamsRouter(db) {
  const router = express.Router();

  const listTeamsStmt = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.created_at,
      COALESCE(SUM(s.points), 0) AS total_points
    FROM teams t
    LEFT JOIN score_entries s ON s.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name COLLATE NOCASE
  `);

  const membersByTeamStmt = db.prepare(`
    SELECT id, team_id, name, created_at
    FROM members
    WHERE team_id = ?
    ORDER BY name COLLATE NOCASE
  `);

  const getTeamStmt = db.prepare("SELECT id, name, created_at FROM teams WHERE id = ?");
  const insertTeamStmt = db.prepare("INSERT INTO teams (name) VALUES (?)");
  const updateTeamStmt = db.prepare("UPDATE teams SET name = ? WHERE id = ?");
  const deleteTeamStmt = db.prepare("DELETE FROM teams WHERE id = ?");
  const insertMemberStmt = db.prepare("INSERT INTO members (team_id, name) VALUES (?, ?)");
  const deleteMemberStmt = db.prepare("DELETE FROM members WHERE id = ? AND team_id = ?");

  function attachMembers(teams) {
    return teams.map((team) => ({
      ...team,
      total_points: Number(team.total_points) || 0,
      members: membersByTeamStmt.all(team.id),
    }));
  }

  router.get("/", (_req, res) => {
    res.json(attachMembers(listTeamsStmt.all()));
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
    return res.json(attachMembers([team])[0]);
  });

  router.post("/", requireAdmin, (req, res) => {
    try {
      const name = trimRequired(req.body?.name, "Teamname");
      const members = Array.isArray(req.body?.members) ? req.body.members : [];

      const create = db.transaction(() => {
        const result = insertTeamStmt.run(name);
        const teamId = result.lastInsertRowid;
        for (const member of members) {
          const memberName = String(member?.name ?? member ?? "").trim();
          if (memberName) {
            insertMemberStmt.run(teamId, memberName);
          }
        }
        return teamId;
      });

      const teamId = create();
      const team = getTeamStmt.get(teamId);
      return res.status(201).json(attachMembers([team])[0]);
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
    if (!getTeamStmt.get(id)) {
      return notFound(res, "Team nicht gefunden.");
    }

    try {
      const name = trimRequired(req.body?.name, "Teamname");
      updateTeamStmt.run(name, id);
      return res.json(attachMembers([getTeamStmt.get(id)])[0]);
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return badRequest(res, "Ein Team mit diesem Namen existiert bereits.");
      }
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
        .prepare("SELECT id, team_id, name, created_at FROM members WHERE id = ?")
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

module.exports = { createTeamsRouter };
