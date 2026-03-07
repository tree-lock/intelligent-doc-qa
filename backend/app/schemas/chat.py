from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.documents import DocumentItem


ChatRole = Literal["user", "assistant"]


class ChatCompletionRequest(BaseModel):
    message: str = Field(min_length=1)
    documents: list[DocumentItem]
    session_id: str | None = Field(default=None, alias="sessionId")
    model_config_id: str | None = Field(default=None, alias="modelConfigId")

    model_config = ConfigDict(populate_by_name=True)


class ChatCompletionResponse(BaseModel):
    content: str
    session_id: str | None = Field(default=None, alias="sessionId")
    created_at: str | None = Field(default=None, alias="createdAt")
    references: list[str] = Field(default_factory=list)
    model_config_id: str | None = Field(default=None, alias="modelConfigId")
    provider: str | None = None
    model_name: str | None = Field(default=None, alias="modelName")

    model_config = ConfigDict(populate_by_name=True)


class ChatMessageItem(BaseModel):
    id: str
    role: ChatRole
    content: str


class ChatSessionItem(BaseModel):
    id: str
    title: str
    messages: list[ChatMessageItem] = Field(default_factory=list)
    loaded_documents: list[DocumentItem] = Field(
        default_factory=list,
        alias="loadedDocuments",
    )
    pending_documents: list[DocumentItem] = Field(
        default_factory=list,
        alias="pendingDocuments",
    )
    current_model_config_id: str | None = Field(
        default=None,
        alias="currentModelConfigId",
    )
    current_provider: str = Field(default="", alias="currentProvider")
    current_model_name: str = Field(default="", alias="currentModelName")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class HealthResponse(BaseModel):
    ok: bool
    app: str
    version: str
