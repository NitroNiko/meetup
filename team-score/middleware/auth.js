/**
 * Simple admin session auth via HttpOnly cookie.
 * Suitable for LAN/demo use; protect with HTTPS in production.
 */
const crypto = require("crypto");

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const COOKIE_NAME = "wyc_admin_session";

/** @type {Map<string, number>} token -> expiresAt */
const sessions = new Map();

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function destroySession(token) {
  if (token) {
    sessions.delete(token);
  }
}

function isValidSession(token) {
  if (!token) {
    return false;
  }
  const expiresAt = sessions.get(token);
  if (!expiresAt) {
    return false;
  }
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function login(req, res) {
  const pin = String(req.body?.pin ?? "").trim();
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Ungültiger Admin-PIN." });
  }

  const token = createSession();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
  });
  return res.json({ ok: true });
}

function logout(req, res) {
  destroySession(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
}

function status(req, res) {
  const ok = isValidSession(req.cookies?.[COOKIE_NAME]);
  return res.json({ authenticated: ok });
}

function requireAdmin(req, res, next) {
  if (!isValidSession(req.cookies?.[COOKIE_NAME])) {
    return res.status(401).json({ error: "Admin-Anmeldung erforderlich." });
  }
  return next();
}

module.exports = {
  COOKIE_NAME,
  login,
  logout,
  status,
  requireAdmin,
};
