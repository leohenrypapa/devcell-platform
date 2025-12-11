from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DevCell Platform"
    API_V1_PREFIX: str = "/api"

    # CORS origins
    # For internal/dev environments it's acceptable to allow all origins.
    # In production, override via env:
    #   BACKEND_CORS_ORIGINS='["https://your-frontend"]'
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # Local LLM configuration (ADR-001)
    LLM_BASE_URL: str = "http://localhost:8000"
    LLM_DEFAULT_MODEL: str = "Qwen/Qwen2.5-Coder-7B-Instruct"

    # Auth / session configuration
    # Fixed lifetime for opaque session tokens (in hours)
    SESSION_TTL_HOURS: int = 8

    # Pydantic v2 style config (replaces inner `Config` class)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
