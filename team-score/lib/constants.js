/** Shared domain constants for WYC Team Score v2. */

const WINNER_MODES = ["highest-score", "lowest-score"];
const DEFAULT_WINNER_MODE = "highest-score";

const GAME_STATUSES = ["draft", "active", "completed", "cancelled"];
/** Legacy alias kept for API compatibility with older clients. */
const LEGACY_STATUS_OPEN = "open";

const SCORING_MODES = ["placement", "jury"];
const DEFAULT_SCORING_MODE = "placement";

const SETTINGS_KEYS = {
  WINNER_MODE: "winnerMode",
};

const NOTE_MAX_LENGTH = 500;

function normalizeGameStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === LEGACY_STATUS_OPEN) {
    return "active";
  }
  return value;
}

function isLeaderboardEligibleStatus(status) {
  return normalizeGameStatus(status) === "completed";
}

function statusLabel(status) {
  switch (normalizeGameStatus(status)) {
    case "draft":
      return "Entwurf";
    case "active":
      return "Laufend";
    case "completed":
      return "Abgeschlossen";
    case "cancelled":
      return "Abgebrochen";
    default:
      return status;
  }
}

function scoringModeLabel(mode) {
  return mode === "jury" ? "Jurorenentscheidung" : "Platzierungswertung";
}

module.exports = {
  WINNER_MODES,
  DEFAULT_WINNER_MODE,
  GAME_STATUSES,
  LEGACY_STATUS_OPEN,
  SCORING_MODES,
  DEFAULT_SCORING_MODE,
  SETTINGS_KEYS,
  NOTE_MAX_LENGTH,
  normalizeGameStatus,
  isLeaderboardEligibleStatus,
  statusLabel,
  scoringModeLabel,
};
