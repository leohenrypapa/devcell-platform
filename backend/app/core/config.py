from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DevCell Platform"
    API_V1_PREFIX: str = "/api"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    LLM_BASE_URL: str = "http://localhost:8000"

    # Default model from /v1/models
    LLM_DEFAULT_MODEL: str = "Qwen/Qwen2.5-Coder-7B-Instruct"
    
    # Pydantic v2 style config (replaces inner `Config` class)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()

