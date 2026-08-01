/**
 * Shared helpers for API routes.
 */
const {
  GAME_STATUSES,
  NOTE_MAX_LENGTH,
  SCORING_MODES,
  normalizeGameStatus,
} = require("../lib/constants");

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function notFound(res, message = "Nicht gefunden.") {
  return res.status(404).json({ error: message });
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function trimRequired(value, fieldName) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`${fieldName} darf nicht leer sein.`);
  }
  return text;
}

function parseNonNegativeInt(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${fieldName} muss eine ganze Zahl >= 0 sein.`);
  }
  return n;
}

function parseInteger(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new Error(`${fieldName} muss eine ganze Zahl sein.`);
  }
  return n;
}

function parseDate(value, fieldName = "date") {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${fieldName} muss im Format JJJJ-MM-TT sein.`);
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new Error(`${fieldName} ist kein gültiges Datum.`);
  }
  return text;
}

function parseHexColor(value, fieldName = "color") {
  const text = String(value ?? "").trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(text)) {
    throw new Error(`${fieldName} muss ein Hex-Wert wie #2E6EA7 sein.`);
  }
  return text.toUpperCase();
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function parseOptionalNote(value, fieldName = "Notiz") {
  const text = String(value ?? "").trim();
  if (text.length > NOTE_MAX_LENGTH) {
    throw new Error(`${fieldName} darf höchstens ${NOTE_MAX_LENGTH} Zeichen haben.`);
  }
  return text;
}

function parseGameStatus(value, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error("status ist erforderlich.");
    }
    return null;
  }
  const status = normalizeGameStatus(value);
  if (!GAME_STATUSES.includes(status)) {
    throw new Error(
      `status muss eines von ${GAME_STATUSES.join(", ")} sein.`
    );
  }
  return status;
}

function parseScoringMode(value, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error("scoring_mode ist erforderlich.");
    }
    return null;
  }
  const mode = String(value).trim().toLowerCase();
  if (!SCORING_MODES.includes(mode)) {
    throw new Error('scoring_mode muss "placement" oder "jury" sein.');
  }
  return mode;
}

function parseTeamIdList(value, fieldName = "team_ids") {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} muss eine nicht-leere Liste von Team-IDs sein.`);
  }
  const ids = value.map((item) => {
    const id = parseId(item);
    if (!id) {
      throw new Error(`${fieldName} enthält eine ungültige Team-ID.`);
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) {
    throw new Error("Jedes Team darf nur einmal vorkommen.");
  }
  return ids;
}

module.exports = {
  badRequest,
  notFound,
  parseId,
  trimRequired,
  parseNonNegativeInt,
  parseInteger,
  parseDate,
  parseHexColor,
  todayDateString,
  parseOptionalNote,
  parseGameStatus,
  parseScoringMode,
  parseTeamIdList,
};
