from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DocumentType = Literal["txt", "markdown"]
DocumentStatus = Literal["ready", "indexing", "failed"]


class DocumentItem(BaseModel):
    id: str
    name: str
    title: str
    plain_text: str = Field(alias="plainText")
    type: DocumentType
    status: DocumentStatus
    updated_at: str = Field(alias="updatedAt")
    source_format: str | None = Field(default=None, alias="sourceFormat")

    model_config = ConfigDict(populate_by_name=True)


class DocumentCreateRequest(BaseModel):
    title: str | None = None
    plain_text: str = Field(alias="plainText", min_length=1)
    type: DocumentType = "txt"

    model_config = ConfigDict(populate_by_name=True)


class DeleteDocumentsRequest(BaseModel):
    ids: list[str]
