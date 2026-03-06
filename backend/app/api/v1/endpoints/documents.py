from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.deps import document_service
from app.schemas.common import MessageResponse
from app.schemas.documents import (
    DocumentCreateResponse,
    DocumentDetailResponse,
    DocumentListResponse,
)

router = APIRouter()


@router.post("", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_document(file: UploadFile = File(...)) -> DocumentCreateResponse:
    return document_service.create(filename=file.filename)


@router.get("", response_model=DocumentListResponse)
def list_documents() -> DocumentListResponse:
    return document_service.list()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: UUID) -> DocumentDetailResponse:
    document = document_service.get(str(document_id))
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", response_model=MessageResponse)
def delete_document(document_id: UUID) -> MessageResponse:
    deleted = document_service.delete(str(document_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return MessageResponse(message="Document deleted")
