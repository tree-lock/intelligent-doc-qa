from app.repositories.config_repo import ConfigRepository
from app.schemas.system import SystemConfigResponse


class ConfigService:
    def __init__(self, repo: ConfigRepository) -> None:
        self.repo = repo

    def list_providers(self) -> list[str]:
        return ["openai", "claude", "local"]

    def get_config(self) -> SystemConfigResponse:
        return self.repo.get()

    def update_config(self, default_provider: str, vector_store: str) -> SystemConfigResponse:
        return self.repo.update(
            default_provider=default_provider,
            vector_store=vector_store,
        )
