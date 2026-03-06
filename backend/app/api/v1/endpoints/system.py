from fastapi import APIRouter

from app.deps import config_service
from app.schemas.system import (
    ProviderListResponse,
    SystemConfigResponse,
    SystemConfigUpdateRequest,
)

router = APIRouter()


@router.get("/providers", response_model=ProviderListResponse)
def list_providers() -> ProviderListResponse:
    return ProviderListResponse(items=config_service.list_providers())


@router.get("/config", response_model=SystemConfigResponse)
def get_system_config() -> SystemConfigResponse:
    return config_service.get_config()


@router.put("/config", response_model=SystemConfigResponse)
def update_system_config(payload: SystemConfigUpdateRequest) -> SystemConfigResponse:
    return config_service.update_config(
        default_provider=payload.default_provider,
        vector_store=payload.vector_store,
    )
