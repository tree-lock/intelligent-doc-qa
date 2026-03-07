from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.chat import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(ok=True, app=settings.app_name, version=settings.app_version)
