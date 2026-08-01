const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const { getLeaderboardSettings, setWinnerMode } = require("../lib/settings");
const { badRequest } = require("./helpers");

function createSettingsRouter(db) {
  const router = express.Router();

  router.get("/leaderboard", (_req, res) => {
    return res.json(getLeaderboardSettings(db));
  });

  router.put("/leaderboard", requireAdmin, (req, res) => {
    try {
      const winnerMode = setWinnerMode(db, req.body?.winnerMode);
      return res.json({ winnerMode });
    } catch (error) {
      return badRequest(res, error.message);
    }
  });

  return router;
}

module.exports = { createSettingsRouter };
