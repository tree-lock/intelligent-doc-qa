import json
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_list_from_env(v: list[str] | str) -> list[str]:
    """将环境变量中的 JSON 字符串或逗号分隔字符串解析为 list，确保 CORS 等配置被正确读取。"""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return []
        if v.startswith("["):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                pass
        return [x.strip() for x in v.split(",") if x.strip()]
    return []


class Settings(BaseSettings):
    app_name: str = "Doc QA Backend"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./doc_qa.db"
    cors_allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
        "https://doc-qa-api.zeabur.app",
    ]

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def parse_cors_allowed_origins(cls, v: list[str] | str) -> list[str]:
        return _parse_list_from_env(v)

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
