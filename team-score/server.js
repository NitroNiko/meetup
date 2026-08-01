/**
 * WYC Team Score Platform – Express entry point.
 * Serves the public frontend and JSON API backed by SQLite.
 */
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const { openDatabase } = require("./db");
const auth = require("./middleware/auth");
const { createTeamsRouter } = require("./routes/teams");
const { createGamesRouter } = require("./routes/games");
const { createScoresRouter, createLeaderboardRouter } = require("./routes/scores");
const { createSettingsRouter } = require("./routes/settings");
const { createJurorsRouter } = require("./routes/jurors");
const { createCorrectionsRouter } = require("./routes/corrections");

function createApp(db) {
  const app = express();

  // Needed behind reverse proxies (Render, Cloudflare Tunnel, etc.)
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "wyc-team-score", version: "2.0.0" });
  });

  app.get("/api/admin/status", auth.status);
  app.post("/api/admin/login", auth.login);
  app.post("/api/admin/logout", auth.logout);

  app.use("/api/teams", createTeamsRouter(db));
  app.use("/api/games", createGamesRouter(db));
  app.use("/api/scores", createScoresRouter(db));
  app.use("/api/leaderboard", createLeaderboardRouter(db));
  app.use("/api/settings", createSettingsRouter(db));
  app.use("/api/jurors", createJurorsRouter(db));
  app.use("/api/corrections", createCorrectionsRouter(db));

  app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Interner Serverfehler." });
  });

  return app;
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "0.0.0.0";
  const db = openDatabase();
  const app = createApp(db);

  app.listen(PORT, HOST, () => {
    console.log(`WYC Team Score läuft auf http://${HOST}:${PORT}`);
    console.log(
      `Admin-PIN: ${process.env.ADMIN_PIN ? "(aus ENV)" : "1234 (Default)"}`
    );
  });
}

module.exports = { createApp };
