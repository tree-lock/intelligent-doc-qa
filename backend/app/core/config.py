from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Doc QA Backend"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"

    default_provider: str = "openai"
    vector_store: str = "faiss"

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
