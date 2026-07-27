# WYC Team Score

Team-Score-Plattform mit Leaderboard für den Württembergischen Yacht-Club e.V.
Eigenständige App unter `team-score/` – die ImmunoQuiz-App im Repository-Root bleibt unverändert.

## Features

- Öffentliche Frontpage mit Leaderboard sowie offenen und abgeschlossenen Spielen
- Admin-Bereich (PIN) zum Anlegen von Teams, Mitgliedern, Spielen und Punkten
- Persistenz in SQLite – gemeinsam nutzbar über mehrere Geräte im Netzwerk
- Design angelehnt an [wyc-fn.de](https://www.wyc-fn.de) (Club-Blau, IBM Plex Sans, Logo & Hero)

## Start

Voraussetzung: Node.js 18+

```bash
cd team-score
npm install
ADMIN_PIN=1234 npm start
```

Dann öffnen: [http://localhost:3000](http://localhost:3000)

### Umgebungsvariablen

| Variable   | Default | Beschreibung        |
|------------|---------|---------------------|
| `PORT`     | `3000`  | HTTP-Port           |
| `ADMIN_PIN`| `1234`  | PIN für den Admin   |
| `NODE_ENV` | –       | `production` setzt Secure-Cookie |

## API (Kurzüberblick)

- `GET /api/leaderboard` – Rangliste
- `GET /api/teams` – Teams inkl. Mitglieder
- `GET /api/games?status=open|completed` – Spiele mit Punkteständen
- `POST /api/admin/login` – `{ "pin": "…" }`
- Schreibende Endpunkte (Teams/Spiele/Scores) erfordern Admin-Session-Cookie

## Daten

SQLite-Datei: `data/team-score.db` (wird beim ersten Start angelegt und mit Demo-Daten befüllt).

## Design / Assets

Logo und Hero-Bilder stammen von der Club-Website. Die Logo-Nutzung ist freigegeben.
