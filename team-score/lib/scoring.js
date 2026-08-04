const { DEFAULT_WINNER_MODE } = require("./constants");

/**
 * Points awarded for a finishing place (1 = best).
 * Aligns with global winnerMode so place 1 benefits under both logics.
 */
function pointsForPlace(place, teamCount, maxPoints = null, winnerMode = DEFAULT_WINNER_MODE) {
  const p = Number(place);
  const n = Number(teamCount);
  if (!Number.isInteger(p) || p < 1 || !Number.isInteger(n) || n < 1 || p > n) {
    throw new Error("Ungültige Platzierung für Punktevergabe.");
  }

  if (winnerMode === "lowest-score") {
    // Lower total wins: best place gets the fewest points.
    if (maxPoints != null && Number.isFinite(Number(maxPoints))) {
      const max = Math.max(0, Math.trunc(Number(maxPoints)));
      return Math.max(0, Math.round((max * p) / n));
    }
    return p;
  }

  // Highest score wins: best place gets the most points.
  if (maxPoints != null && Number.isFinite(Number(maxPoints))) {
    const max = Math.max(0, Math.trunc(Number(maxPoints)));
    return Math.max(0, Math.round((max * (n - p + 1)) / n));
  }
  return n - p + 1;
}

/**
 * Build score rows from an ordered list of team ids (index 0 = place 1).
 */
function scoresFromTeamOrder(teamIds, maxPoints = null, winnerMode = DEFAULT_WINNER_MODE) {
  const ids = Array.isArray(teamIds) ? teamIds.map(Number) : [];
  if (!ids.length) {
    return [];
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Jedes Team darf nur einmal in der Reihenfolge vorkommen.");
  }

  return ids.map((teamId, index) => {
    const place = index + 1;
    return {
      team_id: teamId,
      place,
      points: pointsForPlace(place, ids.length, maxPoints, winnerMode),
    };
  });
}

/**
 * Sort rows by a numeric points field according to winnerMode.
 * Ties broken alphabetically by nameField (case-insensitive).
 */
function sortByWinnerMode(
  rows,
  winnerMode = DEFAULT_WINNER_MODE,
  { pointsField = "total_points", nameField = "name" } = {}
) {
  const copy = [...rows];
  const ascending = winnerMode === "lowest-score";
  copy.sort((a, b) => {
    const pa = Number(a[pointsField]) || 0;
    const pb = Number(b[pointsField]) || 0;
    if (pa !== pb) {
      return ascending ? pa - pb : pb - pa;
    }
    return String(a[nameField] || "").localeCompare(String(b[nameField] || ""), "de", {
      sensitivity: "base",
    });
  });
  return copy;
}

/**
 * Sort leaderboard rows by winnerMode.
 * Ties broken alphabetically by name (case-insensitive).
 */
function sortLeaderboardRows(rows, winnerMode = DEFAULT_WINNER_MODE) {
  return sortByWinnerMode(rows, winnerMode).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

/**
 * Sort game score entries so Platz 1 (gemäß winnerMode) oben steht.
 */
function sortScoreRowsByWinnerMode(rows, winnerMode = DEFAULT_WINNER_MODE) {
  return sortByWinnerMode(rows, winnerMode, {
    pointsField: "points",
    nameField: "team_name",
  }).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

module.exports = {
  pointsForPlace,
  scoresFromTeamOrder,
  sortByWinnerMode,
  sortLeaderboardRows,
  sortScoreRowsByWinnerMode,
};
