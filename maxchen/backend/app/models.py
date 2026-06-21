from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


MemoryCategory = Literal["preferences", "tasks", "projects", "facts", "calendar", "files"]
TaskStatus = Literal["open", "done"]


class MemoryEntry(BaseModel):
    id: str
    category: MemoryCategory
    text: str
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class MemorySnapshot(BaseModel):
    user_name: str = "Max"
    preferences: list[MemoryEntry] = Field(default_factory=list)
    tasks: list[MemoryEntry] = Field(default_factory=list)
    projects: list[MemoryEntry] = Field(default_factory=list)
    facts: list[MemoryEntry] = Field(default_factory=list)
    calendar: list[MemoryEntry] = Field(default_factory=list)
    files: list[MemoryEntry] = Field(default_factory=list)
    interactions: list[dict[str, Any]] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    tool_name: str | None = None
    tool_payload: dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    tool: str
    ok: bool
    data: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class ChatResponse(BaseModel):
    assistant_name: str = "Mäxchen"
    reply: str
    memory_updates: list[MemoryEntry] = Field(default_factory=list)
    tool_results: list[ToolResult] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class MemoryCreateRequest(BaseModel):
    category: MemoryCategory
    text: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class TaskCreateRequest(BaseModel):
    text: str = Field(min_length=1)
    due: str | None = None


class TaskUpdateRequest(BaseModel):
    status: TaskStatus


class CalendarCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    when: str = Field(min_length=1)
    notes: str | None = None


class FileSummaryRequest(BaseModel):
    filename: str = "notiz.txt"
    content: str = Field(min_length=1)


class WebRequestPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    url: HttpUrl
    method: Literal["GET", "POST"] = "GET"
    json_body: dict[str, Any] | None = Field(default=None, alias="json")


class SpeechSynthesisRequest(BaseModel):
    text: str = Field(min_length=1)

