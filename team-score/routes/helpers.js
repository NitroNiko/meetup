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

module.exports = {
  badRequest,
  notFound,
  parseId,
  trimRequired,
  parseNonNegativeInt,
  parseInteger,
};
