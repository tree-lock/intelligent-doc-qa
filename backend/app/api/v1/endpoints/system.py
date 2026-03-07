from fastapi import APIRouter, Depends, Response, status

from app.core.config import get_settings
from app.core.database import Database
from app.repositories.system_repo import SystemRepository
from app.schemas.system import (
    LLMConfigCreateRequest,
    LLMConfigItem,
    LLMConfigListResponse,
    LLMConfigTestRequest,
    LLMConfigTestResponse,
    LLMConfigUpdateRequest,
    MineruTokenStatusResponse,
    MineruTokenUpdateRequest,
    ProviderListResponse,
)
from app.services.system_service import SystemService

router = APIRouter(prefix="/system", tags=["system"])


def get_system_service() -> SystemService:
    settings = get_settings()
    database = Database(settings.database_url)
    repository = SystemRepository(database)
    return SystemService(repository, settings)


@router.get("/providers", response_model=ProviderListResponse)
def list_providers(
    service: SystemService = Depends(get_system_service),
) -> ProviderListResponse:
    return ProviderListResponse(items=service.list_providers())


@router.get("/llm-configs", response_model=LLMConfigListResponse)
def list_llm_configs(
    service: SystemService = Depends(get_system_service),
) -> LLMConfigListResponse:
    return LLMConfigListResponse(items=service.list_llm_configs())


@router.post(
    "/llm-configs",
    response_model=LLMConfigItem,
    status_code=status.HTTP_201_CREATED,
)
def create_llm_config(
    payload: LLMConfigCreateRequest,
    service: SystemService = Depends(get_system_service),
) -> LLMConfigItem:
    return service.create_llm_config(payload)


@router.post("/llm-configs/test", response_model=LLMConfigTestResponse)
def test_llm_config(
    payload: LLMConfigTestRequest,
    service: SystemService = Depends(get_system_service),
) -> LLMConfigTestResponse:
    return service.test_llm_config(payload)


@router.put("/llm-configs/{config_id}", response_model=LLMConfigItem)
def update_llm_config(
    config_id: str,
    payload: LLMConfigUpdateRequest,
    service: SystemService = Depends(get_system_service),
) -> LLMConfigItem:
    return service.update_llm_config(config_id, payload)


@router.delete("/llm-configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_llm_config(
    config_id: str,
    service: SystemService = Depends(get_system_service),
) -> Response:
    service.delete_llm_config(config_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/mineru-token", response_model=MineruTokenStatusResponse)
def get_mineru_token_status(
    service: SystemService = Depends(get_system_service),
) -> MineruTokenStatusResponse:
    return service.get_mineru_token_status()


@router.put("/mineru-token", status_code=status.HTTP_204_NO_CONTENT)
def update_mineru_token(
    payload: MineruTokenUpdateRequest,
    service: SystemService = Depends(get_system_service),
) -> Response:
    service.set_mineru_token(payload.token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
