# AGENTS.md

## Cursor Cloud specific instructions

### Product scope

The **primary application** is **Capital Atelier** at the repository root: a dependency-free static SPA (`index.html`, `app.js`, `styles.css`). Other folders are legacy Data Science Dojo tutorial materials and are not required to run or test the game.

### Services

| Service | Required | Command |
|---------|----------|---------|
| Static HTTP server | Yes | `python3 -m http.server 8080` (from repo root) |
| Browser | Yes | Open `http://localhost:8080` |

There is no backend, database, build step, or package manager. Game state persists in browser `localStorage` (`capitalAtelierState`).

### Lint / test

No lint or automated test tooling is configured for Capital Atelier. Verification is manual: serve the static files and exercise the UI in a browser.

### Development notes

- Use a tmux session for the dev server so it stays running across agent turns.
- Stock market ticks run on a ~5s interval; prices and net worth update in the UI after purchases.
- Optional browser push notifications require granting permission via the Profile tab toggle.
- Simulated real-money shop purchases are client-side only; no external API keys are needed.
