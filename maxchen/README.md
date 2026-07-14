# Mäxchen

Mäxchen ist eine smarte KI-Assistenz für Max: ruhig, intelligent, futuristisch, höflich und leicht humorvoll. Die App kombiniert FastAPI, ein JSON-Gedächtnis, Werkzeugaufrufe, Web Speech API und eine moderne React-Weboberfläche mit Avatar.

## Ordnerstruktur

```text
maxchen/
  backend/
    app/
      assistant.py        # Persönlichkeit, Dialoglogik, Tool-Auswahl
      config.py           # Umgebungsvariablen und Pfade
      main.py             # FastAPI-Routen
      memory.py           # JSON-Memory mit Auto-Erkennung
      models.py           # API-Modelle
      speech.py           # TTS/STT-Fähigkeiten
      tools.py            # Kalender, Aufgaben, Dateien, Web, Smart Home
      storage/
    tests/
      test_api.py
    requirements.txt
  frontend/
    src/
      assets/maxchen-avatar.svg
      components/
      api.ts
      App.tsx
      main.tsx
      styles.css
      types.ts
    package.json
```

## Funktionen

- Sprachsystem: Browser Speech-to-Text und Text-to-Speech über Web Speech API; optional ElevenLabs-TTS über `MAXCHEN_ELEVENLABS_API_KEY`.
- Gedächtnis: JSON-Datei speichert Vorlieben, Aufgaben, Projekte, wichtige Aussagen, Kalender- und Datei-Erinnerungen.
- Tools: Aufgaben, Kalender, Datei-Zusammenfassung, Web-Requests und simuliertes Smart Home.
- Avatar: lokales SVG mit Statusanimationen für Standby, Zuhören, Denken und Sprechen.
- UI: React/Vite-Web-App, responsive für Desktop und Mobile-Browser.

## Backend installieren und starten

```bash
cd maxchen/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000`

Wichtige Routen:

- `GET /health`
- `POST /api/chat`
- `GET /api/memory`
- `POST /api/tasks`
- `GET /api/calendar`
- `POST /api/tools/files/summarize`
- `POST /api/tools/web-request`
- `POST /api/speech/synthesize`

## Frontend installieren und starten

```bash
cd maxchen/frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

Optional kann die API-Basis angepasst werden:

```bash
VITE_API_BASE=http://localhost:8000 npm run dev
```

## Tests

```bash
cd maxchen/backend
python -m pytest
```

```bash
cd maxchen/frontend
npm run build
```

