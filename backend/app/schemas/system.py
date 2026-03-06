from pydantic import BaseModel


class ProviderListResponse(BaseModel):
    items: list[str]


class SystemConfigResponse(BaseModel):
    default_provider: str
    vector_store: str


class SystemConfigUpdateRequest(BaseModel):
    default_provider: str
    vector_store: str
