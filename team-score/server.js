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

const PORT = Number(process.env.PORT) || 3000;
const db = openDatabase();
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());

// Public API
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "wyc-team-score" });
});

app.get("/api/admin/status", auth.status);
app.post("/api/admin/login", auth.login);
app.post("/api/admin/logout", auth.logout);

app.use("/api/teams", createTeamsRouter(db));
app.use("/api/games", createGamesRouter(db));
app.use("/api/scores", createScoresRouter(db));
app.use("/api/leaderboard", createLeaderboardRouter(db));

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Interner Serverfehler." });
});

app.listen(PORT, () => {
  console.log(`WYC Team Score läuft auf http://localhost:${PORT}`);
  console.log(`Admin-PIN: ${process.env.ADMIN_PIN ? "(aus ENV)" : "1234 (Default)"}`);
});
