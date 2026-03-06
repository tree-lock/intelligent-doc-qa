from datetime import datetime
from uuid import uuid4

from app.repositories.document_repo import DocumentRepository
from app.schemas.documents import (
    DocumentCreateResponse,
    DocumentDetailResponse,
    DocumentListResponse,
)


class DocumentService:
    def __init__(self, repo: DocumentRepository) -> None:
        self.repo = repo

    def create(self, filename: str) -> DocumentCreateResponse:
        now = datetime.utcnow()
        document = DocumentDetailResponse(
            id=uuid4(),
            filename=filename,
            created_at=now,
            content_preview="Pending parser pipeline...",
        )
        self.repo.add(document)
        return DocumentCreateResponse(
            id=document.id,
            filename=document.filename,
            created_at=document.created_at,
        )

    def list(self) -> DocumentListResponse:
        return DocumentListResponse(items=self.repo.list())

    def get(self, document_id: str) -> DocumentDetailResponse | None:
        return self.repo.get(document_id)

    def delete(self, document_id: str) -> bool:
        return self.repo.delete(document_id)
