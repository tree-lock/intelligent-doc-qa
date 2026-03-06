from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ChatCompletionRequest(BaseModel):
    question: str
    session_id: UUID | None = None


class ChatCompletionResponse(BaseModel):
    session_id: UUID
    answer: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSessionItem(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionItem]


class ChatSessionDetailResponse(ChatSessionItem):
    messages: list[dict[str, str]] = Field(default_factory=list)
