from __future__ import annotations

import re

from .memory import MemoryStore
from .models import ChatResponse, ToolResult
from .tools import ToolRegistry


class MaxchenAssistant:
    """Rule-based assistant core that can be replaced by an LLM later."""

    def __init__(self, memory: MemoryStore, tools: ToolRegistry):
        self.memory = memory
        self.tools = tools

    async def chat(self, message: str, tool_name: str | None = None, tool_payload: dict | None = None) -> ChatResponse:
        memory_updates = self.memory.extract_and_store(message)
        tool_results: list[ToolResult] = []

        if tool_name:
            tool_results.append(await self.tools.execute(tool_name, tool_payload or {}))
        else:
            inferred = self._infer_tool(message)
            if inferred:
                name, payload = inferred
                tool_results.append(await self.tools.execute(name, payload))

        reply = self._compose_reply(message, tool_results, len(memory_updates))
        self.memory.remember_interaction(message, reply, [result.tool for result in tool_results])

        return ChatResponse(
            reply=reply,
            memory_updates=memory_updates,
            tool_results=tool_results,
            suggestions=[
                "Merke dir: Ich bevorzuge kurze Antworten.",
                "Erstelle eine Aufgabe: Morgen Trainingsplan prüfen.",
                "Fasse diese Datei zusammen.",
                "Was steht in meinem Kalender?",
            ],
        )

    def _infer_tool(self, message: str) -> tuple[str, dict] | None:
        lower = message.lower()
        if "liste" in lower and "aufgabe" in lower:
            return "tasks.list", {}
        if "kalender" in lower and any(word in lower for word in ["zeige", "liste", "was steht"]):
            return "calendar.list", {}
        if "smart home" in lower or "licht" in lower:
            return "smart_home.simulate", {"room": "Arbeitszimmer", "device": "Licht", "state": "futuristisch gedimmt"}

        task_match = re.search(r"(?:erstelle|neue|füge|fuege).*aufgabe[: ]+(.*)", message, re.IGNORECASE)
        if task_match:
            return "tasks.create", {"text": task_match.group(1).strip()}

        calendar_match = re.search(r"(?:termin|kalender)[: ]+(.+?)\s+(?:am|um|für|fuer)\s+(.+)", message, re.IGNORECASE)
        if calendar_match:
            return "calendar.create", {"title": calendar_match.group(1).strip(), "when": calendar_match.group(2).strip()}

        return None

    def _compose_reply(self, message: str, tool_results: list[ToolResult], memory_count: int) -> str:
        snapshot = self.memory.snapshot()
        context_bits = []
        if snapshot.preferences:
            context_bits.append(f"Ich berücksichtige deine Vorliebe: {snapshot.preferences[0].text}")
        if snapshot.projects:
            context_bits.append(f"Aktives Projekt im Gedächtnis: {snapshot.projects[0].text}")

        if tool_results:
            tool_sentence = self._tool_sentence(tool_results)
            memory_sentence = f" Ich habe außerdem {memory_count} neue Erinnerung(en) gespeichert." if memory_count else ""
            return f"Max, erledigt. {tool_sentence}{memory_sentence}"

        if any(word in message.lower() for word in ["hallo", "start", "wer bist"]):
            return (
                "Max, ich bin Mäxchen: ruhig, analytisch und bereit für Sprache, Gedächtnis und Werkzeuge. "
                "Jarvis hätte vermutlich eine theatralischere Begrüßung gewählt."
            )

        memory_sentence = "Ich habe das in meinem Gedächtnis abgelegt." if memory_count else "Ich habe deine Anfrage analysiert."
        context_sentence = " ".join(context_bits)
        if context_sentence:
            context_sentence = " " + context_sentence
        return f"Max, {memory_sentence}{context_sentence} Wie soll ich als Nächstes fortfahren?"

    @staticmethod
    def _tool_sentence(results: list[ToolResult]) -> str:
        parts = []
        for result in results:
            if not result.ok:
                parts.append(f"{result.tool} meldet: {result.error}")
                continue
            if result.tool == "tasks.create":
                parts.append("Die Aufgabe ist gespeichert.")
            elif result.tool == "tasks.list":
                count = len(result.data.get("tasks", []))
                parts.append(f"Ich sehe {count} Aufgabe(n).")
            elif result.tool == "calendar.create":
                parts.append("Der Kalendereintrag ist angelegt.")
            elif result.tool == "calendar.list":
                count = len(result.data.get("events", []))
                parts.append(f"Im Kalender liegen {count} Eintrag/Einträge.")
            elif result.tool == "files.summarize":
                parts.append(f"Dateizusammenfassung: {result.data.get('summary', '')}")
            elif result.tool == "web.request":
                parts.append(f"Web-Request abgeschlossen, Status {result.data.get('status_code')}.")
            else:
                parts.append(str(result.data.get("message", "Tool erfolgreich ausgeführt.")))
        return " ".join(parts)

