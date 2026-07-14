from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration with sensible local defaults."""

    app_name: str = "Mäxchen"
    memory_path: Path = Field(default=Path(__file__).parent / "storage" / "memory.json")
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])
    elevenlabs_api_key: str | None = None
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    azure_speech_key: str | None = None
    azure_speech_region: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_prefix="MAXCHEN_", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

