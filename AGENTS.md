# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**Capital Atelier** is the primary application at the repository root (`index.html`, `app.js`, `styles.css`). It is a dependency-free, client-side mobile finance game (German UI). Game state persists in browser `localStorage` under the key `capitalAtelierState`.

Subfolders contain legacy Data Science Dojo meetup workshop materials (R, Python, Azure, etc.) and are **not** part of the Capital Atelier runtime.

### Running the app

From the repo root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. Use a tmux session for long-running servers (e.g. session name `capital-atelier-server`).

### Lint / test / build

There is **no** `package.json`, bundler, ESLint config, or automated test suite. Available checks:

| Check | Command |
|-------|---------|
| JS syntax | `node --check app.js` |
| HTTP smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` |

No build step is required; files are served as static assets.

### Hello-world verification

1. Load `http://localhost:8080` — default tab is **Aktien** with starting balance ~1,250 EUR.
2. Click **Kaufen** on a stock — wallet should decrease and a toast confirms the purchase.
3. Switch tabs via bottom nav (Shop, Profil) to confirm routing works.

### Workshop subfolders (optional, out of scope for main app)

These require external tooling (R, Azure, Power BI, Twitter API, etc.) and are documented in each folder's README. Do not install them unless explicitly working on a specific workshop.
