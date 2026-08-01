const { getWinnerMode } = require("./settings");
const { scoresFromTeamOrder } = require("./scoring");

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Replace a game's result score_entries with points derived from team order.
 * Keeps a single result row per team for the game's result date.
 */
function applyGameResults(db, game, teamIds, options = {}) {
  const winnerMode = options.winnerMode || getWinnerMode(db);
  const scoreDate = options.scoreDate || todayDateString();
  const note = options.note != null ? String(options.note) : "Spielwertung";

  const scores = scoresFromTeamOrder(
    teamIds,
    game.max_points,
    winnerMode
  );

  const deleteStmt = db.prepare("DELETE FROM score_entries WHERE game_id = ?");
  const insertStmt = db.prepare(`
    INSERT INTO score_entries (game_id, team_id, points, note, awarded_at, score_date)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
  `);

  const run = db.transaction(() => {
    deleteStmt.run(game.id);
    for (const score of scores) {
      insertStmt.run(game.id, score.team_id, score.points, note, scoreDate);
    }
  });
  run();

  return scores;
}

function clearGameResults(db, gameId) {
  db.prepare("DELETE FROM score_entries WHERE game_id = ?").run(gameId);
}

module.exports = {
  applyGameResults,
  clearGameResults,
};
