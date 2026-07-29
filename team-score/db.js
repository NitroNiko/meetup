/**
 * SQLite persistence for the Team Score platform.
 * Creates schema on first run and seeds demo data when the DB is empty.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "team-score.db");

function openDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);
  seedIfEmpty(db);

  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
      max_points INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS score_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      points INTEGER NOT NULL CHECK (points >= 0),
      note TEXT NOT NULL DEFAULT '',
      awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (game_id, team_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_members_team ON members(team_id);
    CREATE INDEX IF NOT EXISTS idx_scores_game ON score_entries(game_id);
    CREATE INDEX IF NOT EXISTS idx_scores_team ON score_entries(team_id);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
  `);

  // Manual point corrections (can be negative); applied on top of game scores.
  const teamColumns = db.prepare("PRAGMA table_info(teams)").all();
  if (!teamColumns.some((column) => column.name === "adjustment_points")) {
    db.exec(
      "ALTER TABLE teams ADD COLUMN adjustment_points INTEGER NOT NULL DEFAULT 0"
    );
  }
}

function seedIfEmpty(db) {
  const teamCount = db.prepare("SELECT COUNT(*) AS count FROM teams").get().count;
  if (teamCount > 0) {
    return;
  }

  const insertTeam = db.prepare("INSERT INTO teams (name) VALUES (?)");
  const insertMember = db.prepare("INSERT INTO members (team_id, name) VALUES (?, ?)");
  const insertGame = db.prepare(
    "INSERT INTO games (title, description, status, max_points, completed_at) VALUES (?, ?, ?, ?, ?)"
  );
  const insertScore = db.prepare(
    "INSERT INTO score_entries (game_id, team_id, points, note) VALUES (?, ?, ?, ?)"
  );

  const seed = db.transaction(() => {
    const blue = insertTeam.run("Team Blau").lastInsertRowid;
    const red = insertTeam.run("Team Rot").lastInsertRowid;
    const green = insertTeam.run("Team Grün").lastInsertRowid;

    insertMember.run(blue, "Anna");
    insertMember.run(blue, "Ben");
    insertMember.run(red, "Clara");
    insertMember.run(red, "David");
    insertMember.run(green, "Elena");
    insertMember.run(green, "Felix");

    const openGame = insertGame.run(
      "Bojenparcours",
      "Schnelligkeit und Präzision rund um die Marken.",
      "open",
      100,
      null
    ).lastInsertRowid;

    const doneGame = insertGame.run(
      "Hafenstaffel",
      "Teamstaffel vom Steg zum Clubhaus.",
      "completed",
      50,
      new Date().toISOString()
    ).lastInsertRowid;

    insertScore.run(doneGame, blue, 42, "Starker Schlusslauf");
    insertScore.run(doneGame, red, 38, "");
    insertScore.run(doneGame, green, 45, "Bestzeit");
    insertScore.run(openGame, blue, 20, "Zwischenstand");
    insertScore.run(openGame, red, 15, "Zwischenstand");
  });

  seed();
}

module.exports = { openDatabase, DB_PATH };
