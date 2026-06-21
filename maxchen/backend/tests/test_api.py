from fastapi.testclient import TestClient

from app.main import create_app


def make_client(tmp_path):
    app = create_app(tmp_path / "memory.json")
    return TestClient(app)


def test_chat_remembers_preferences_and_addresses_max(tmp_path):
    client = make_client(tmp_path)

    response = client.post("/api/chat", json={"message": "Ich bevorzuge kurze Antworten."})

    assert response.status_code == 200
    body = response.json()
    assert body["assistant_name"] == "Mäxchen"
    assert body["reply"].startswith("Max,")
    assert body["memory_updates"][0]["category"] == "preferences"

    memory = client.get("/api/memory").json()
    assert memory["preferences"][0]["text"] == "Ich bevorzuge kurze Antworten."


def test_task_tool_creates_and_lists_tasks(tmp_path):
    client = make_client(tmp_path)

    create_response = client.post(
        "/api/chat",
        json={"message": "Neue Aufgabe: Projektstatus prüfen", "tool_name": "tasks.create", "tool_payload": {"text": "Projektstatus prüfen"}},
    )
    assert create_response.status_code == 200
    assert create_response.json()["tool_results"][0]["ok"] is True

    list_response = client.post("/api/chat", json={"message": "Liste meine Aufgaben"})
    assert list_response.status_code == 200
    tools = list_response.json()["tool_results"]
    assert tools[0]["tool"] == "tasks.list"
    assert tools[0]["data"]["tasks"][0]["text"] == "Projektstatus prüfen"


def test_file_summary_tool_stores_summary(tmp_path):
    client = make_client(tmp_path)

    response = client.post(
        "/api/tools/files/summarize",
        json={
            "filename": "plan.txt",
            "content": "Mäxchen soll Max beim Planen helfen. Mäxchen speichert Aufgaben und Projekte. Die UI nutzt Sprache.",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert "Mäxchen soll Max beim Planen helfen" in body["data"]["summary"]
    assert client.get("/api/memory").json()["files"][0]["metadata"]["filename"] == "plan.txt"

