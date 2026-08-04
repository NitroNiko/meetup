# WYC Team Score

Team-Score-Plattform mit Leaderboard für den Württembergischen Yacht-Club e.V.
Eigenständige App unter `team-score/` – die ImmunoQuiz-App im Repository-Root bleibt unverändert.

## Features (v2.1)

- Öffentliche Frontpage mit Leaderboard sowie offenen und abgeschlossenen Spielen
- **Nur abgeschlossene Spiele** fließen in die Gesamtwertung ein
- Globale **Gewinnlogik** auch für Spielpunkt-Tabellen in „Spiele verwalten“
- Spiel-Bewertungsmodi: **Platzierungswertung** und **Jurorenentscheidung** (Juror als Freitext)
- Bewertungsdatum für Platzierung, Jury und Korrekturen (korrekte Tageswertung)
- Soft-Delete einzelner Jurorenbewertungen
- Toast-Feedback und Backend-Verbindungsstatus (inkl. Draft-Puffer)
- Punktekorrekturen mit Notiz – getrennt von der Spielwertung
- Kompakte Admin-Navigation
- Persistenz in SQLite – gemeinsam nutzbar über mehrere Geräte im Netzwerk
- Design angelehnt an [wyc-fn.de](https://www.wyc-fn.de) (Club-Blau, IBM Plex Sans, Logo & Hero)

## Start (lokal)

Voraussetzung: Node.js 18+

```bash
cd team-score
npm install
ADMIN_PIN=1234 npm start
```

Dann öffnen: [http://localhost:3000](http://localhost:3000)

### Umgebungsvariablen

| Variable    | Default   | Beschreibung                          |
|-------------|-----------|---------------------------------------|
| `PORT`      | `3000`    | HTTP-Port                             |
| `HOST`      | `0.0.0.0` | Bind-Adresse                          |
| `ADMIN_PIN` | `1234`    | PIN für den Admin                     |
| `NODE_ENV`  | –         | `production` setzt Secure-Cookie      |

### Tests

```bash
cd team-score
npm test
```

## Deployment

### Docker (VPS / lokal)

```bash
cd team-score
ADMIN_PIN='dein-pin' docker compose up -d --build
```

Persistente Daten liegen im Volume `wyc-team-score-data`.

### Render.com

1. Neuen **Web Service** aus diesem GitHub-Repo anlegen
2. **Root Directory:** `team-score`
3. **Build:** `npm ci` · **Start:** `npm start`
4. Env: `NODE_ENV=production`, `ADMIN_PIN=…`, `HOST=0.0.0.0`
5. Optional: Persistent Disk auf `/opt/render/project/src/team-score/data` (sonst geht die SQLite-DB bei Restarts verloren)

Blueprint: [`render.yaml`](render.yaml)

### Fly.io (empfohlen für wenig Traffic)

Voraussetzung: Account auf [fly.io](https://fly.io) (Login mit GitHub).

```bash
cd team-score
fly auth login
fly apps create wyc-team-score   # falls App noch nicht existiert
fly volumes create wyc_data --region fra --size 1
fly secrets set ADMIN_PIN='dein-pin'
fly deploy
```

Danach: `https://wyc-team-score.fly.dev`  
Logs: `fly logs` · Status: `fly status`

`fly.toml` stoppt die Machine bei Idle (`min_machines_running = 0`) und startet sie bei Anfragen automatisch wieder – günstig bei wenig Traffic. SQLite liegt auf dem Volume `wyc_data`.

### Cloudflare Tunnel (Demo)

Für schnelle öffentliche HTTPS-URLs ohne eigenen Server:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

## API (Kurzüberblick)

- `GET /api/leaderboard` – Rangliste (`winnerMode`, nur `completed`-Spiele)
- `GET/PUT /api/settings/leaderboard` – globale Gewinnlogik
- `GET /api/teams` – Teams inkl. Mitglieder und Korrekturen
- `GET /api/games?status=active|completed|draft|cancelled` – Spiele mit Wertung
- `PUT /api/games/:id/placement` – Platzierungsreihenfolge speichern
- `PUT /api/games/:id/jury-rankings` – Jurorenbewertung speichern
- `GET /api/games/:id/standings` – Live-Zwischenstand (Admin)
- `GET/POST/PUT/DELETE /api/jurors` – Jurorenverwaltung
- `GET/POST/PUT/DELETE /api/corrections` – Punktekorrekturen inkl. Notiz
- `POST /api/admin/login` – `{ "pin": "…" }`
- Schreibende Endpunkte erfordern Admin-Session-Cookie

## Daten

SQLite-Datei: `data/team-score.db` (wird beim ersten Start angelegt und mit Demo-Daten befüllt).

Spielstatus: `draft` | `active` | `completed` | `cancelled`  
Bewertungsmodus: `placement` | `jury`

## Design / Assets

Logo und Hero-Bilder stammen von der Club-Website. Die Logo-Nutzung ist freigegeben.
