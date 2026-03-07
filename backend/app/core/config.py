from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Doc QA Backend"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./doc_qa.db"
    cors_allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    chunk_size: int = 800
    chunk_overlap: int = 120
    system_providers: list[str] = ["openai", "claude", "local", "community"]
    remote_api_key_providers: list[str] = ["openai", "claude"]
    api_base_required_providers: list[str] = ["local", "community"]
    local_provider_name: str = "local"

    use_vector_search: bool = True
    chroma_persist_path: str = "./data/chroma"
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    # MinerU 文档解析（PDF、Word、PPT、图片、HTML -> Markdown）
    # 在 https://mineru.net/apiManage 申请 Token
    mineru_api_token: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
