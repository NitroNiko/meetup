/**
 * Shared helpers for API routes.
 */

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
};
