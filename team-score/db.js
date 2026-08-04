/**
 * SQLite persistence for the Team Score platform.
 * Creates schema on first run and seeds demo data when the DB is empty.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const {
  DEFAULT_WINNER_MODE,
  DEFAULT_SCORING_MODE,
  SETTINGS_KEYS,
} = require("./lib/constants");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "team-score.db");

const DEFAULT_TEAM_COLORS = ["#2E6EA7", "#E12914", "#5ABC8E", "#F5C161", "#6B5B95", "#1B3F61"];

function openDatabase(dbPath = DB_PATH) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
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

function tableExists(db, tableName) {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
    )
    .get(tableName);
  return Boolean(row);
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
  migrateV2(db);
  migrateV21(db);
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

function migrateV2(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jurors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS score_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT 'Admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_corrections_team ON score_corrections(team_id);
  `);

  const winner = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(SETTINGS_KEYS.WINNER_MODE);
  if (!winner) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      SETTINGS_KEYS.WINNER_MODE,
      DEFAULT_WINNER_MODE
    );
  }

  migrateGamesV2(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS placement_rankings (
      game_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      place INTEGER NOT NULL CHECK (place >= 1),
      PRIMARY KEY (game_id, team_id),
      UNIQUE (game_id, place),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jury_ballots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      juror_id INTEGER NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (game_id, juror_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (juror_id) REFERENCES jurors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jury_ballot_items (
      ballot_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      place INTEGER NOT NULL CHECK (place >= 1),
      PRIMARY KEY (ballot_id, team_id),
      UNIQUE (ballot_id, place),
      FOREIGN KEY (ballot_id) REFERENCES jury_ballots(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jury_ballots_game ON jury_ballots(game_id);
    CREATE INDEX IF NOT EXISTS idx_placement_game ON placement_rankings(game_id);
  `);

  migrateAdjustmentsToCorrections(db);
}

/**
 * v2.1: evaluation dates, freitext juror names, soft-delete ballots.
 */
function migrateV21(db) {
  if (!hasColumn(db, "games", "evaluation_date")) {
    db.exec("ALTER TABLE games ADD COLUMN evaluation_date TEXT");
    db.exec(`
      UPDATE games
      SET evaluation_date = COALESCE(date(completed_at), date(created_at), date('now'))
      WHERE evaluation_date IS NULL OR evaluation_date = ''
    `);
  }

  if (!hasColumn(db, "score_corrections", "evaluation_date")) {
    db.exec("ALTER TABLE score_corrections ADD COLUMN evaluation_date TEXT");
    db.exec(`
      UPDATE score_corrections
      SET evaluation_date = COALESCE(date(created_at), date('now'))
      WHERE evaluation_date IS NULL OR evaluation_date = ''
    `);
  }

  migrateJuryBallotsV21(db);
}

function migrateJuryBallotsV21(db) {
  if (!tableExists(db, "jury_ballots")) {
    return;
  }

  const alreadyMigrated =
    hasColumn(db, "jury_ballots", "juror_name") &&
    hasColumn(db, "jury_ballots", "evaluation_date") &&
    hasColumn(db, "jury_ballots", "deleted_at");

  if (alreadyMigrated) {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_jury_active_name
      ON jury_ballots(game_id, juror_name COLLATE NOCASE)
      WHERE deleted_at IS NULL
    `);
    return;
  }

  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE jury_ballots_v21 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      juror_name TEXT NOT NULL,
      evaluation_date TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    INSERT INTO jury_ballots_v21 (id, game_id, juror_name, evaluation_date, submitted_at, updated_at, deleted_at)
    SELECT
      b.id,
      b.game_id,
      COALESCE(NULLIF(TRIM(j.name), ''), 'Juror ' || b.juror_id),
      COALESCE(date(b.submitted_at), date('now')),
      b.submitted_at,
      b.updated_at,
      NULL
    FROM jury_ballots b
    LEFT JOIN jurors j ON j.id = b.juror_id;

    DROP TABLE jury_ballots;
    ALTER TABLE jury_ballots_v21 RENAME TO jury_ballots;

    CREATE INDEX IF NOT EXISTS idx_jury_ballots_game ON jury_ballots(game_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jury_active_name
      ON jury_ballots(game_id, juror_name COLLATE NOCASE)
      WHERE deleted_at IS NULL;
  `);
  db.pragma("foreign_keys = ON");
}

function migrateGamesV2(db) {
  const needsRebuild =
    !hasColumn(db, "games", "scoring_mode") ||
    !gamesStatusAllowsV2(db);

  if (!needsRebuild) {
    return;
  }

  // Parent rebuild while score_entries still references games.
  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE games_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
      scoring_mode TEXT NOT NULL DEFAULT 'placement'
        CHECK (scoring_mode IN ('placement', 'jury')),
      max_points INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    INSERT INTO games_v2 (id, title, description, status, scoring_mode, max_points, created_at, completed_at)
    SELECT
      id,
      title,
      description,
      CASE
        WHEN status = 'open' THEN 'active'
        WHEN status = 'completed' THEN 'completed'
        WHEN status IN ('draft', 'active', 'cancelled') THEN status
        ELSE 'active'
      END,
      '${DEFAULT_SCORING_MODE}',
      max_points,
      created_at,
      completed_at
    FROM games;

    DROP TABLE games;
    ALTER TABLE games_v2 RENAME TO games;
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
  `);
  db.pragma("foreign_keys = ON");
}

function gamesStatusAllowsV2(db) {
  // Detect old CHECK by trying to read sql; fallback: no scoring_mode means rebuild already handled.
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'games'")
    .get();
  if (!row?.sql) {
    return false;
  }
  return (
    row.sql.includes("'draft'") &&
    row.sql.includes("'active'") &&
    row.sql.includes("scoring_mode")
  );
}

function migrateAdjustmentsToCorrections(db) {
  if (!tableExists(db, "score_corrections") || !hasColumn(db, "teams", "adjustment_points")) {
    return;
  }

  const correctionCount = db
    .prepare("SELECT COUNT(*) AS count FROM score_corrections")
    .get().count;
  if (correctionCount > 0) {
    syncAllAdjustmentPoints(db);
    return;
  }

  const teams = db
    .prepare(
      "SELECT id, adjustment_points FROM teams WHERE adjustment_points != 0"
    )
    .all();

  const insert = db.prepare(`
    INSERT INTO score_corrections (team_id, points, note, created_by)
    VALUES (?, ?, ?, ?)
  `);

  const migrate = db.transaction(() => {
    for (const team of teams) {
      insert.run(
        team.id,
        team.adjustment_points,
        "Migrierte Gesamtkorrektur",
        "System"
      );
    }
  });
  migrate();
  syncAllAdjustmentPoints(db);
}

function syncTeamAdjustmentPoints(db, teamId) {
  const sum = db
    .prepare(
      "SELECT COALESCE(SUM(points), 0) AS total FROM score_corrections WHERE team_id = ?"
    )
    .get(teamId).total;
  db.prepare("UPDATE teams SET adjustment_points = ? WHERE id = ?").run(
    sum,
    teamId
  );
  return Number(sum) || 0;
}

function syncAllAdjustmentPoints(db) {
  db.exec(`
    UPDATE teams
    SET adjustment_points = COALESCE((
      SELECT SUM(points) FROM score_corrections WHERE team_id = teams.id
    ), 0)
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
    "INSERT INTO games (title, description, status, scoring_mode, max_points, completed_at) VALUES (?, ?, ?, ?, ?, ?)"
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

    const activeGame = insertGame.run(
      "Bojenparcours",
      "Schnelligkeit und Präzision rund um die Marken.",
      "active",
      "placement",
      100,
      null
    ).lastInsertRowid;

    const doneGame = insertGame.run(
      "Hafenstaffel",
      "Teamstaffel vom Steg zum Clubhaus.",
      "completed",
      "placement",
      50,
      new Date().toISOString()
    ).lastInsertRowid;

    insertScore.run(doneGame, blue, 42, "Starker Schlusslauf", yesterday);
    insertScore.run(doneGame, red, 38, "", yesterday);
    insertScore.run(doneGame, green, 45, "Bestzeit", yesterday);
    // Active-game scores stay stored but are excluded from the leaderboard until completion.
    insertScore.run(activeGame, blue, 20, "Zwischenstand", today);
    insertScore.run(activeGame, red, 15, "Zwischenstand", today);
  });

  seed();
}

module.exports = {
  openDatabase,
  DB_PATH,
  DEFAULT_TEAM_COLORS,
  syncTeamAdjustmentPoints,
  syncAllAdjustmentPoints,
};
