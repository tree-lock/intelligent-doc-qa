from fastapi import APIRouter, Depends, File, Response, UploadFile, status

from app.core.config import get_settings
from app.core.database import Database
from app.repositories.document_repo import DocumentRepository
from app.schemas.documents import (
    DeleteDocumentsRequest,
    DocumentCreateRequest,
    DocumentItem,
)
from app.services.document_service import DocumentService
from app.services.vector_store_service import get_vector_store_service

router = APIRouter(prefix="/documents", tags=["documents"])


def get_document_service() -> DocumentService:
    settings = get_settings()
    database = Database(settings.database_url)
    repository = DocumentRepository(database)
    vector_store = get_vector_store_service(
        enabled=settings.use_vector_search,
        persist_directory=settings.chroma_persist_path,
        embedding_model=settings.embedding_model,
    )
    return DocumentService(repository, settings, vector_store=vector_store)


@router.get("", response_model=list[DocumentItem])
def list_documents(
    service: DocumentService = Depends(get_document_service),
) -> list[DocumentItem]:
    return service.list_documents()


@router.post("", response_model=DocumentItem, status_code=status.HTTP_201_CREATED)
def create_document_from_text(
    payload: DocumentCreateRequest,
    service: DocumentService = Depends(get_document_service),
) -> DocumentItem:
    return service.create_document_from_text(payload)


@router.post(
    "/upload",
    response_model=list[DocumentItem],
    status_code=status.HTTP_201_CREATED,
)
async def upload_documents(
    files: list[UploadFile] = File(...),
    service: DocumentService = Depends(get_document_service),
) -> list[DocumentItem]:
    return await service.upload_documents(files)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_documents(
    payload: DeleteDocumentsRequest,
    service: DocumentService = Depends(get_document_service),
) -> Response:
    service.delete_documents(payload.ids)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
