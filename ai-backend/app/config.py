import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "DevFix AI Service"
    LLM_PROVIDER: str = "gemini"
    LLM_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: str = ""
    XAI_API_KEY: str = ""
    XAI_MODEL: str = "grok-4.6"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    NODE_CORE_API_URL: str = "http://localhost:5000/api"
    INTERNAL_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/devfix_db"
    SANDBOX_IMAGE: str = "devfix-sandbox:latest"
    MAX_CONCURRENT_SANDBOXES: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
