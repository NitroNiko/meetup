const {
  DEFAULT_WINNER_MODE,
  SETTINGS_KEYS,
  WINNER_MODES,
} = require("./constants");

function getSetting(db, key, fallback = null) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, String(value));
}

function getWinnerMode(db) {
  const value = getSetting(db, SETTINGS_KEYS.WINNER_MODE, DEFAULT_WINNER_MODE);
  return WINNER_MODES.includes(value) ? value : DEFAULT_WINNER_MODE;
}

function setWinnerMode(db, mode) {
  const normalized = String(mode ?? "").trim();
  if (!WINNER_MODES.includes(normalized)) {
    throw new Error('winnerMode muss "highest-score" oder "lowest-score" sein.');
  }
  setSetting(db, SETTINGS_KEYS.WINNER_MODE, normalized);
  return normalized;
}

function getLeaderboardSettings(db) {
  return { winnerMode: getWinnerMode(db) };
}

module.exports = {
  getSetting,
  setSetting,
  getWinnerMode,
  setWinnerMode,
  getLeaderboardSettings,
};
