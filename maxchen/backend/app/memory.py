from __future__ import annotations

import json
import re
import threading
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from .models import MemoryCategory, MemoryEntry, MemorySnapshot


class MemoryStore:
    """Small JSON-backed memory store for Max's assistant data."""

    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write(MemorySnapshot())

    def snapshot(self) -> MemorySnapshot:
        with self._lock:
            return self._read()

    def add(self, category: MemoryCategory, text: str, metadata: dict | None = None) -> MemoryEntry:
        with self._lock:
            snapshot = self._read()
            entry = MemoryEntry(
                id=str(uuid4()),
                category=category,
                text=text.strip(),
                created_at=datetime.now(UTC),
                metadata=metadata or {},
            )
            getattr(snapshot, category).insert(0, entry)
            self._trim(snapshot)
            self._write(snapshot)
            return entry

    def update_task_status(self, task_id: str, status: str) -> MemoryEntry | None:
        with self._lock:
            snapshot = self._read()
            for task in snapshot.tasks:
                if task.id == task_id:
                    task.metadata["status"] = status
                    task.metadata["updated_at"] = datetime.now(UTC).isoformat()
                    self._write(snapshot)
                    return task
            return None

    def remember_interaction(self, user_message: str, reply: str, tool_names: list[str]) -> None:
        with self._lock:
            snapshot = self._read()
            snapshot.interactions.insert(
                0,
                {
                    "at": datetime.now(UTC).isoformat(),
                    "user": user_message,
                    "assistant": reply,
                    "tools": tool_names,
                },
            )
            snapshot.interactions = snapshot.interactions[:50]
            self._write(snapshot)

    def extract_and_store(self, text: str) -> list[MemoryEntry]:
        updates: list[MemoryEntry] = []
        normalized = " ".join(text.strip().split())
        lower = normalized.lower()

        preference_match = re.search(r"\b(ich mag|ich bevorzuge|mir ist wichtig|ich liebe)\b[: ]+(.*)", lower)
        if preference_match:
            updates.append(self.add("preferences", normalized, {"source": "auto_extraction"}))

        if any(marker in lower for marker in ["erinnere dich", "merk dir", "wichtig:", "wichtige aussage"]):
            cleaned = re.sub(r"^(maxchen|mäxchen)[, ]*", "", normalized, flags=re.IGNORECASE)
            updates.append(self.add("facts", cleaned, {"source": "auto_extraction"}))

        if any(marker in lower for marker in ["aufgabe", "todo", "erledigen", "task"]):
            updates.append(self.add("tasks", normalized, {"status": "open", "source": "auto_extraction"}))

        if "projekt" in lower:
            updates.append(self.add("projects", normalized, {"source": "auto_extraction"}))

        if any(marker in lower for marker in ["termin", "kalender", "meeting"]):
            updates.append(self.add("calendar", normalized, {"source": "auto_extraction"}))

        return updates

    def _read(self) -> MemorySnapshot:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            return MemorySnapshot.model_validate(raw)
        except (json.JSONDecodeError, OSError, ValueError):
            return MemorySnapshot()

    def _write(self, snapshot: MemorySnapshot) -> None:
        temp_path = self.path.with_suffix(".tmp")
        temp_path.write_text(
            json.dumps(snapshot.model_dump(mode="json"), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temp_path.replace(self.path)

    @staticmethod
    def _trim(snapshot: MemorySnapshot) -> None:
        for category in ["preferences", "tasks", "projects", "facts", "calendar", "files"]:
            setattr(snapshot, category, getattr(snapshot, category)[:100])

