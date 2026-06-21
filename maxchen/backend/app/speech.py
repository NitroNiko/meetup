from __future__ import annotations

import base64

import httpx

from .config import Settings


async def synthesize_speech(text: str, settings: Settings) -> dict:
    """Return browser fallback metadata or ElevenLabs audio when configured."""

    if not settings.elevenlabs_api_key:
        return {
            "provider": "browser",
            "text": text,
            "message": "Nutze die Web Speech API im Frontend fuer lokale Sprachausgabe.",
        }

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.62, "similarity_boost": 0.78},
    }
    headers = {"xi-api-key": settings.elevenlabs_api_key, "accept": "audio/mpeg"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()

    return {
        "provider": "elevenlabs",
        "mime_type": "audio/mpeg",
        "audio_base64": base64.b64encode(response.content).decode("ascii"),
    }


def transcribe_capabilities() -> dict:
    return {
        "provider": "browser",
        "message": "Speech-to-Text laeuft im Frontend ueber die Web Speech API. Whisper kann spaeter serverseitig ergaenzt werden.",
    }

