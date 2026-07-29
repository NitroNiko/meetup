/**
 * SQLite persistence for the Team Score platform.
 * Creates schema on first run and seeds demo data when the DB is empty.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "team-score.db");

const DEFAULT_TEAM_COLORS = ["#2E6EA7", "#E12914", "#5ABC8E", "#F5C161", "#6B5B95", "#1B3F61"];

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

function tableColumns(db, tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all();
}

function hasColumn(db, tableName, columnName) {
  return tableColumns(db, tableName).some((column) => column.name === columnName);
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
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_members_team ON members(team_id);
    CREATE INDEX IF NOT EXISTS idx_scores_game ON score_entries(game_id);
    CREATE INDEX IF NOT EXISTS idx_scores_team ON score_entries(team_id);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
  `);

  if (!hasColumn(db, "teams", "adjustment_points")) {
    db.exec(
      "ALTER TABLE teams ADD COLUMN adjustment_points INTEGER NOT NULL DEFAULT 0"
    );
  }

  if (!hasColumn(db, "teams", "color")) {
    db.exec("ALTER TABLE teams ADD COLUMN color TEXT NOT NULL DEFAULT '#2E6EA7'");
    const teams = db.prepare("SELECT id FROM teams ORDER BY id").all();
    const updateColor = db.prepare("UPDATE teams SET color = ? WHERE id = ?");
    teams.forEach((team, index) => {
      updateColor.run(DEFAULT_TEAM_COLORS[index % DEFAULT_TEAM_COLORS.length], team.id);
    });
  }

  migrateScoreDates(db);
}

/**
 * Ensures score_date exists and uniqueness is (game_id, team_id, score_date)
 * so the same game can award points on multiple days.
 */
function migrateScoreDates(db) {
  if (!hasColumn(db, "score_entries", "score_date")) {
    db.exec("ALTER TABLE score_entries ADD COLUMN score_date TEXT");
    db.exec(`
      UPDATE score_entries
      SET score_date = COALESCE(date(awarded_at), date('now'))
      WHERE score_date IS NULL OR score_date = ''
    `);
  }

  const indexes = db.prepare("PRAGMA index_list(score_entries)").all();
  const hasDateUnique = indexes.some((index) => {
    if (!index.unique) {
      return false;
    }
    const cols = db.prepare(`PRAGMA index_info(${index.name})`).all().map((c) => c.name);
    return (
      cols.length === 3 &&
      cols.includes("game_id") &&
      cols.includes("team_id") &&
      cols.includes("score_date")
    );
  });

  if (hasDateUnique) {
    db.exec("CREATE INDEX IF NOT EXISTS idx_scores_date ON score_entries(score_date)");
    return;
  }

  // Rebuild table to replace old UNIQUE(game_id, team_id) with date-aware unique key.
  db.exec(`
    CREATE TABLE score_entries_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      points INTEGER NOT NULL CHECK (points >= 0),
      note TEXT NOT NULL DEFAULT '',
      awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
      score_date TEXT NOT NULL,
      UNIQUE (game_id, team_id, score_date),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    INSERT INTO score_entries_new (id, game_id, team_id, points, note, awarded_at, score_date)
    SELECT
      id,
      game_id,
      team_id,
      points,
      note,
      awarded_at,
      COALESCE(NULLIF(score_date, ''), date(awarded_at), date('now'))
    FROM score_entries;

    DROP TABLE score_entries;
    ALTER TABLE score_entries_new RENAME TO score_entries;

    CREATE INDEX IF NOT EXISTS idx_scores_game ON score_entries(game_id);
    CREATE INDEX IF NOT EXISTS idx_scores_team ON score_entries(team_id);
    CREATE INDEX IF NOT EXISTS idx_scores_date ON score_entries(score_date);
  `);
}

function seedIfEmpty(db) {
  const teamCount = db.prepare("SELECT COUNT(*) AS count FROM teams").get().count;
  if (teamCount > 0) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const insertTeam = db.prepare("INSERT INTO teams (name, color) VALUES (?, ?)");
  const insertMember = db.prepare("INSERT INTO members (team_id, name) VALUES (?, ?)");
  const insertGame = db.prepare(
    "INSERT INTO games (title, description, status, max_points, completed_at) VALUES (?, ?, ?, ?, ?)"
  );
  const insertScore = db.prepare(
    "INSERT INTO score_entries (game_id, team_id, points, note, score_date) VALUES (?, ?, ?, ?, ?)"
  );

  const seed = db.transaction(() => {
    const blue = insertTeam.run("Team Blau", "#2E6EA7").lastInsertRowid;
    const red = insertTeam.run("Team Rot", "#E12914").lastInsertRowid;
    const green = insertTeam.run("Team Grün", "#5ABC8E").lastInsertRowid;

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

    insertScore.run(doneGame, blue, 42, "Starker Schlusslauf", yesterday);
    insertScore.run(doneGame, red, 38, "", yesterday);
    insertScore.run(doneGame, green, 45, "Bestzeit", yesterday);
    insertScore.run(openGame, blue, 20, "Zwischenstand", today);
    insertScore.run(openGame, red, 15, "Zwischenstand", today);
  });

  seed();
}

module.exports = { openDatabase, DB_PATH, DEFAULT_TEAM_COLORS };
