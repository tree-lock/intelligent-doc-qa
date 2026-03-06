from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DocumentCreateResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    filename: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentItem(BaseModel):
    id: UUID
    filename: str
    created_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentItem]


class DocumentDetailResponse(DocumentItem):
    content_preview: str = ""
