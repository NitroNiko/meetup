# AGENTS.md

## Project overview

**Capital Atelier** is a dependency-free static mobile finance game prototype at the repository root (`index.html`, `app.js`, `styles.css`). Game state is stored in browser `localStorage`; there is no backend, database, or package manager.

Legacy **Data Science Dojo meetup** workshop materials live in subdirectories (`intro_to_ml_with_r_and_caret/`, `real-time_sentiment/`, etc.) and are not part of the main product.

## Cursor Cloud specific instructions

### Primary app (Capital Atelier)

| Task | Command |
|------|---------|
| Start dev server | `python3 -m http.server 8080` (from repo root) |
| Open app | http://localhost:8080 |
| JS syntax check | `node --check app.js` |

There are no `npm install`, lint, or automated test scripts for the main app. Verification is manual in the browser or via `curl http://localhost:8080`.

### Services

Only one process is required: a static HTTP server on port **8080**. No Docker, Redis, or external APIs.

### Development notes

- The UI is German (`lang="de"`). Default tab is **Aktien** (stocks); bottom nav switches between Aktien, Immobilien, ETFs, Shop, and Profil.
- Starting cash is 1,250 EUR and 24 diamonds (see `app.js` initial state). A typical smoke test: open the app, click **Kaufen** on a stock, confirm the toast and balance change, then switch tabs.
- Market prices tick every 5 seconds (`setInterval` in `app.js`); the page updates without a page reload.
- Optional browser features: `Notification` API for push toasts; a missing favicon may log a harmless 404 in the console.
- Run the HTTP server in tmux if you need a long-lived session (e.g. `tmux -f /exec-daemon/tmux.portal.conf new-session -d -s capital-atelier-server -c /workspace -- python3 -m http.server 8080`).

### Meetup subdirectories (optional)

Those folders are standalone R/Python/Azure tutorials with their own READMEs and external tooling (R, Azure, Twitter API, etc.). They do not need to run alongside Capital Atelier.
