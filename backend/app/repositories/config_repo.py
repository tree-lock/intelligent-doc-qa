from app.schemas.system import SystemConfigResponse


class ConfigRepository:
    """In-memory repository placeholder for MVP stage."""

    def __init__(self, default_provider: str, vector_store: str) -> None:
        self._config = SystemConfigResponse(
            default_provider=default_provider, vector_store=vector_store
        )

    def get(self) -> SystemConfigResponse:
        return self._config

    def update(self, default_provider: str, vector_store: str) -> SystemConfigResponse:
        self._config = SystemConfigResponse(
            default_provider=default_provider,
            vector_store=vector_store,
        )
        return self._config
