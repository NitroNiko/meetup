from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx

from .memory import MemoryStore
from .models import CalendarCreateRequest, FileSummaryRequest, TaskCreateRequest, ToolResult, WebRequestPayload


class ToolRegistry:
    """Executes assistant tools and keeps tool state in memory."""

    def __init__(self, memory: MemoryStore):
        self.memory = memory
        self._tools: dict[str, Callable[[dict[str, Any]], ToolResult]] = {
            "tasks.list": self.list_tasks,
            "tasks.create": self.create_task,
            "calendar.list": self.list_calendar,
            "calendar.create": self.create_calendar_event,
            "files.summarize": self.summarize_file,
            "smart_home.simulate": self.simulate_smart_home,
        }

    async def execute(self, name: str, payload: dict[str, Any] | None = None) -> ToolResult:
        payload = payload or {}
        if name == "web.request":
            return await self.web_request(payload)
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(tool=name, ok=False, error=f"Unbekanntes Tool: {name}")
        try:
            return tool(payload)
        except ValueError as exc:
            return ToolResult(tool=name, ok=False, error=str(exc))

    def list_tasks(self, _: dict[str, Any]) -> ToolResult:
        tasks = [entry.model_dump(mode="json") for entry in self.memory.snapshot().tasks]
        return ToolResult(tool="tasks.list", ok=True, data={"tasks": tasks})

    def create_task(self, payload: dict[str, Any]) -> ToolResult:
        request = TaskCreateRequest.model_validate(payload)
        entry = self.memory.add("tasks", request.text, {"status": "open", "due": request.due})
        return ToolResult(tool="tasks.create", ok=True, data={"task": entry.model_dump(mode="json")})

    def list_calendar(self, _: dict[str, Any]) -> ToolResult:
        events = [entry.model_dump(mode="json") for entry in self.memory.snapshot().calendar]
        return ToolResult(tool="calendar.list", ok=True, data={"events": events})

    def create_calendar_event(self, payload: dict[str, Any]) -> ToolResult:
        request = CalendarCreateRequest.model_validate(payload)
        text = f"{request.title} - {request.when}"
        entry = self.memory.add("calendar", text, {"when": request.when, "notes": request.notes})
        return ToolResult(tool="calendar.create", ok=True, data={"event": entry.model_dump(mode="json")})

    def summarize_file(self, payload: dict[str, Any]) -> ToolResult:
        request = FileSummaryRequest.model_validate(payload)
        summary = summarize_text(request.content)
        entry = self.memory.add(
            "files",
            f"{request.filename}: {summary}",
            {"filename": request.filename, "chars": len(request.content)},
        )
        return ToolResult(
            tool="files.summarize",
            ok=True,
            data={"filename": request.filename, "summary": summary, "memory": entry.model_dump(mode="json")},
        )

    async def web_request(self, payload: dict[str, Any]) -> ToolResult:
        request = WebRequestPayload.model_validate(payload)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.request(request.method, str(request.url), json=request.json)
            preview = response.text[:900]
            return ToolResult(
                tool="web.request",
                ok=True,
                data={"status_code": response.status_code, "headers": dict(response.headers), "preview": preview},
            )
        except httpx.HTTPError as exc:
            return ToolResult(tool="web.request", ok=False, error=str(exc))

    def simulate_smart_home(self, payload: dict[str, Any]) -> ToolResult:
        room = str(payload.get("room", "Arbeitszimmer"))
        device = str(payload.get("device", "Licht"))
        state = str(payload.get("state", "gedimmt"))
        return ToolResult(tool="smart_home.simulate", ok=True, data={"message": f"{device} im {room}: {state}"})


def summarize_text(content: str) -> str:
    compact = " ".join(content.split())
    sentences = [part.strip() for part in compact.replace("!", ".").replace("?", ".").split(".") if part.strip()]
    if not sentences:
        return compact[:240]
    lead = ". ".join(sentences[:3])
    keywords = keyword_list(compact)
    suffix = f" Kernbegriffe: {', '.join(keywords)}." if keywords else ""
    return f"{lead[:500]}{'.' if not lead.endswith('.') else ''}{suffix}"


def keyword_list(content: str) -> list[str]:
    words = [
        word.strip(".,:;()[]{}").lower()
        for word in content.split()
        if len(word.strip(".,:;()[]{}")) > 5
    ]
    counts: dict[str, int] = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return [word for word, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:5]]

