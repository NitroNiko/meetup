import { FormEvent, useEffect, useMemo, useState } from "react";

import { API_BASE, getMemory, sendChat, summarizeFile, webRequest } from "./api";
import { Avatar } from "./components/Avatar";
import { speak, VoiceControls } from "./components/VoiceControls";
import type { ChatMessage, MemoryEntry, MemorySnapshot } from "./types";

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Max, ich bin Mäxchen. Ruhig, analytisch und bereit, Gedächtnis, Sprache und Werkzeuge zu verbinden.",
  },
];

const emptyMemory: MemorySnapshot = {
  user_name: "Max",
  preferences: [],
  tasks: [],
  projects: [],
  facts: [],
  calendar: [],
  files: [],
  interactions: [],
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [memory, setMemory] = useState<MemorySnapshot>(emptyMemory);
  const [mood, setMood] = useState<"idle" | "listening" | "speaking" | "thinking">("idle");
  const [busy, setBusy] = useState(false);
  const [fileText, setFileText] = useState("Mäxchen soll Max morgens an Termine erinnern und Projektideen strukturiert speichern.");
  const [webUrl, setWebUrl] = useState("https://example.com");
  const [toolNote, setToolNote] = useState("Noch kein Tool ausgeführt.");

  useEffect(() => {
    refreshMemory();
  }, []);

  const memoryStats = useMemo(
    () => [
      ["Vorlieben", memory.preferences.length],
      ["Aufgaben", memory.tasks.length],
      ["Projekte", memory.projects.length],
      ["Aussagen", memory.facts.length],
      ["Kalender", memory.calendar.length],
      ["Dateien", memory.files.length],
    ],
    [memory],
  );

  async function refreshMemory() {
    try {
      setMemory(await getMemory());
    } catch (error) {
      setToolNote(error instanceof Error ? error.message : "Memory konnte nicht geladen werden.");
    }
  }

  async function handleSubmit(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || busy) return;

    setInput("");
    setBusy(true);
    setMood("thinking");
    setMessages((current) => [...current, { role: "user", text }]);

    try {
      const response = await sendChat(text);
      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
      setToolNote(response.tool_results[0]?.error ?? response.tool_results[0]?.tool ?? `${response.memory_updates.length} Memory-Update(s)`);
      await refreshMemory();
      speak(response.reply, () => setMood("speaking"), () => setMood("idle"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setMessages((current) => [...current, { role: "assistant", text: `Max, da ist ein Systemfehler: ${message}` }]);
      setMood("idle");
    } finally {
      setBusy(false);
      if (mood !== "speaking") setMood("idle");
    }
  }

  async function runFileSummary() {
    setBusy(true);
    setMood("thinking");
    try {
      const result = await summarizeFile("max-plan.txt", fileText);
      setToolNote(String(result.data.summary ?? "Datei zusammengefasst."));
      await refreshMemory();
    } catch (error) {
      setToolNote(error instanceof Error ? error.message : "Datei-Tool fehlgeschlagen.");
    } finally {
      setBusy(false);
      setMood("idle");
    }
  }

  async function runWebRequest() {
    setBusy(true);
    setMood("thinking");
    try {
      const result = await webRequest(webUrl);
      setToolNote(`HTTP ${String(result.data.status_code)}: ${String(result.data.preview).slice(0, 120)}`);
    } catch (error) {
      setToolNote(error instanceof Error ? error.message : "Web-Request fehlgeschlagen.");
    } finally {
      setBusy(false);
      setMood("idle");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">KI Assistenz für Max</p>
          <h1>Mäxchen</h1>
          <p>
            Sprachdialog, persistentes Gedächtnis und Werkzeugzugriff in einer futuristischen Oberfläche. Höflich,
            analytisch, leicht humorvoll.
          </p>
          <div className="status-grid">
            {memoryStats.map(([label, count]) => (
              <article key={label}>
                <strong>{count}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>
        <Avatar mood={mood} />
      </section>

      <section className="workspace">
        <article className="chat-card">
          <header>
            <div>
              <p className="eyebrow">Echtzeit-Dialog</p>
              <h2>Sprich mit Mäxchen</h2>
            </div>
            <span>{API_BASE}</span>
          </header>
          <div className="chat-log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={(event) => handleSubmit(event)} className="prompt-row">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Max, frage Mäxchen etwas..." />
            <button disabled={busy}>Senden</button>
          </form>
          <VoiceControls
            disabled={busy}
            onListeningChange={(listening) => setMood(listening ? "listening" : "idle")}
            onTranscript={(text) => handleSubmit(undefined, text)}
          />
          <div className="quick-actions">
            {["Hallo Mäxchen", "Liste meine Aufgaben", "Erstelle Aufgabe: Abendroutine prüfen"].map((text) => (
              <button key={text} onClick={() => handleSubmit(undefined, text)} disabled={busy}>
                {text}
              </button>
            ))}
          </div>
        </article>

        <aside className="side-stack">
          <ToolPanel
            fileText={fileText}
            setFileText={setFileText}
            webUrl={webUrl}
            setWebUrl={setWebUrl}
            toolNote={toolNote}
            runFileSummary={runFileSummary}
            runWebRequest={runWebRequest}
            busy={busy}
          />
          <MemoryPanel memory={memory} />
        </aside>
      </section>
    </main>
  );
}

function ToolPanel(props: {
  fileText: string;
  setFileText: (text: string) => void;
  webUrl: string;
  setWebUrl: (text: string) => void;
  toolNote: string;
  runFileSummary: () => void;
  runWebRequest: () => void;
  busy: boolean;
}) {
  return (
    <article className="tool-card">
      <p className="eyebrow">Werkzeuge</p>
      <h2>Tools ausführen</h2>
      <label>
        Dateiinhalt
        <textarea value={props.fileText} onChange={(event) => props.setFileText(event.target.value)} />
      </label>
      <button onClick={props.runFileSummary} disabled={props.busy}>
        Datei zusammenfassen
      </button>
      <label>
        Web-Request
        <input value={props.webUrl} onChange={(event) => props.setWebUrl(event.target.value)} />
      </label>
      <button onClick={props.runWebRequest} disabled={props.busy}>
        URL abrufen
      </button>
      <p className="tool-note">{props.toolNote}</p>
    </article>
  );
}

function MemoryPanel({ memory }: { memory: MemorySnapshot }) {
  return (
    <article className="memory-card">
      <p className="eyebrow">Gedächtnis</p>
      <h2>Max wird wiedererkannt</h2>
      <MemoryList title="Vorlieben" entries={memory.preferences} />
      <MemoryList title="Aufgaben" entries={memory.tasks} />
      <MemoryList title="Projekte" entries={memory.projects} />
      <MemoryList title="Kalender" entries={memory.calendar} />
    </article>
  );
}

function MemoryList({ title, entries }: { title: string; entries: MemoryEntry[] }) {
  return (
    <section className="memory-list">
      <h3>{title}</h3>
      {entries.length === 0 ? <p>Keine Einträge.</p> : entries.slice(0, 3).map((entry) => <p key={entry.id}>{entry.text}</p>)}
    </section>
  );
}

