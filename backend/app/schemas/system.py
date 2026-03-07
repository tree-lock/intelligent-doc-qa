from pydantic import BaseModel, ConfigDict, Field


class ProviderListResponse(BaseModel):
    items: list[str]


class LLMConfigItem(BaseModel):
    id: str
    name: str
    provider: str
    api_base: str = Field(alias="apiBase")
    model_name: str = Field(alias="modelName")
    temperature: float
    top_p: float = Field(alias="topP")
    max_tokens: int = Field(alias="maxTokens")
    is_default: bool = Field(alias="isDefault")
    has_api_key: bool = Field(alias="hasApiKey")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class LLMConfigListResponse(BaseModel):
    items: list[LLMConfigItem]


class LLMConfigCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    api_key: str | None = Field(default=None, alias="apiKey")
    api_base: str | None = Field(default=None, alias="apiBase")
    model_name: str = Field(alias="modelName", min_length=1)
    temperature: float = Field(ge=0, le=1)
    top_p: float = Field(alias="topP", ge=0, le=1)
    max_tokens: int = Field(alias="maxTokens", ge=1, le=32768)
    is_default: bool = Field(alias="isDefault")

    model_config = ConfigDict(populate_by_name=True)


class LLMConfigUpdateRequest(BaseModel):
    name: str | None = None
    provider: str | None = None
    api_key: str | None = Field(default=None, alias="apiKey")
    api_base: str | None = Field(default=None, alias="apiBase")
    model_name: str | None = Field(default=None, alias="modelName")
    temperature: float | None = Field(default=None, ge=0, le=1)
    top_p: float | None = Field(default=None, alias="topP", ge=0, le=1)
    max_tokens: int | None = Field(default=None, alias="maxTokens", ge=1, le=32768)
    is_default: bool | None = Field(default=None, alias="isDefault")

    model_config = ConfigDict(populate_by_name=True)


class LLMConfigTestRequest(BaseModel):
    """Minimal config for connectivity test (no save)."""

    provider: str = Field(min_length=1)
    api_key: str | None = Field(default=None, alias="apiKey")
    api_base: str | None = Field(default=None, alias="apiBase")
    model_name: str = Field(alias="modelName", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class LLMConfigTestResponse(BaseModel):
    ok: bool
    detail: str | None = None
