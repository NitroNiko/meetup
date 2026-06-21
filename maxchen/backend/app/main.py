from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .assistant import MaxchenAssistant
from .config import Settings, get_settings
from .memory import MemoryStore
from .models import (
    CalendarCreateRequest,
    ChatRequest,
    ChatResponse,
    FileSummaryRequest,
    MemoryCreateRequest,
    MemorySnapshot,
    SpeechSynthesisRequest,
    TaskCreateRequest,
    TaskUpdateRequest,
    ToolResult,
    WebRequestPayload,
)
from .speech import synthesize_speech, transcribe_capabilities
from .tools import ToolRegistry


def create_app(memory_path: Path | None = None) -> FastAPI:
    settings = get_settings()
    memory = MemoryStore(memory_path or settings.memory_path)
    tools = ToolRegistry(memory)
    assistant = MaxchenAssistant(memory, tools)

    app = FastAPI(title="Mäxchen Assistant API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def get_memory() -> MemoryStore:
        return memory

    def get_tools() -> ToolRegistry:
        return tools

    def get_assistant() -> MaxchenAssistant:
        return assistant

    @app.get("/health")
    def health() -> dict:
        return {"ok": True, "assistant": "Mäxchen", "user": memory.snapshot().user_name}

    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest, core: MaxchenAssistant = Depends(get_assistant)) -> ChatResponse:
        return await core.chat(request.message, request.tool_name, request.tool_payload)

    @app.get("/api/memory", response_model=MemorySnapshot)
    def read_memory(store: MemoryStore = Depends(get_memory)) -> MemorySnapshot:
        return store.snapshot()

    @app.post("/api/memory")
    def create_memory(request: MemoryCreateRequest, store: MemoryStore = Depends(get_memory)) -> dict:
        entry = store.add(request.category, request.text, request.metadata)
        return {"entry": entry}

    @app.get("/api/tasks")
    def list_tasks(store: MemoryStore = Depends(get_memory)) -> dict:
        return {"tasks": store.snapshot().tasks}

    @app.post("/api/tasks")
    def create_task(request: TaskCreateRequest, store: MemoryStore = Depends(get_memory)) -> dict:
        entry = store.add("tasks", request.text, {"status": "open", "due": request.due})
        return {"task": entry}

    @app.patch("/api/tasks/{task_id}")
    def update_task(task_id: str, request: TaskUpdateRequest, store: MemoryStore = Depends(get_memory)) -> dict:
        entry = store.update_task_status(task_id, request.status)
        if not entry:
            raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
        return {"task": entry}

    @app.get("/api/calendar")
    def list_calendar(store: MemoryStore = Depends(get_memory)) -> dict:
        return {"events": store.snapshot().calendar}

    @app.post("/api/calendar")
    def create_calendar_event(request: CalendarCreateRequest, store: MemoryStore = Depends(get_memory)) -> dict:
        entry = store.add("calendar", f"{request.title} - {request.when}", {"when": request.when, "notes": request.notes})
        return {"event": entry}

    @app.post("/api/tools/files/summarize", response_model=ToolResult)
    def summarize_file(request: FileSummaryRequest, registry: ToolRegistry = Depends(get_tools)) -> ToolResult:
        return registry.summarize_file(request.model_dump())

    @app.post("/api/tools/web-request", response_model=ToolResult)
    async def web_request(request: WebRequestPayload, registry: ToolRegistry = Depends(get_tools)) -> ToolResult:
        return await registry.web_request(request.model_dump(mode="json"))

    @app.post("/api/speech/synthesize")
    async def speech_synthesize(request: SpeechSynthesisRequest) -> dict:
        return await synthesize_speech(request.text, settings)

    @app.get("/api/speech/transcribe")
    def speech_transcribe() -> dict:
        return transcribe_capabilities()

    return app


app = create_app()

