from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = "postgresql+psycopg://release_tracker:release_tracker@localhost:5433/release_tracker"

AiProvider = Literal["ollama", "gemini", "mock"]


class Settings(BaseSettings):
    database_url: str = DEFAULT_DATABASE_URL

    # ollama = local LLM (free), gemini = Google cloud, mock = offline demo
    ai_provider: AiProvider = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma3:latest"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
