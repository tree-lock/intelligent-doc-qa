from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings
from app.repositories.document_repo import DocumentRepository
from app.schemas.documents import DocumentCreateRequest, DocumentItem


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DocumentService:
    def __init__(self, repository: DocumentRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    def list_documents(self) -> list[DocumentItem]:
        return [self._to_document_item(row) for row in self.repository.list_documents()]

    def create_document_from_text(self, payload: DocumentCreateRequest) -> DocumentItem:
        normalized_text = self.normalize_plain_text(payload.plain_text)
        if not normalized_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document plainText cannot be empty after normalization.",
            )
        title = (payload.title or "untitled").strip() or "untitled"
        extension = "md" if payload.type == "markdown" else "txt"
        name = title if title.endswith(f".{extension}") else f"{title}.{extension}"

        if self.repository.get_by_name(name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Document with name '{name}' already exists.",
            )

        created = self.repository.create_document(
            name=name,
            title=title,
            plain_text=normalized_text,
            document_type=payload.type,
            status="ready",
            updated_at=utc_now_iso(),
        )
        self.repository.replace_chunks(created["id"], self.chunk_plain_text(normalized_text))
        return self._to_document_item(created)

    async def upload_documents(self, files: list[UploadFile]) -> list[DocumentItem]:
        uploaded: list[DocumentItem] = []
        for file in files:
            created = await self.ingest_uploaded_file(file)
            if created is not None:
                uploaded.append(created)
        return uploaded

    async def ingest_uploaded_file(self, file: UploadFile) -> DocumentItem | None:
        raw_bytes = await file.read()
        return self.ingest_uploaded_bytes(
            filename=file.filename or "untitled.txt",
            content_type=file.content_type,
            raw_bytes=raw_bytes,
        )

    def ingest_uploaded_bytes(
        self,
        *,
        filename: str,
        content_type: str | None,
        raw_bytes: bytes,
    ) -> DocumentItem | None:
        document_type = self.detect_document_type(filename=filename, content_type=content_type)
        if self.repository.get_by_name(filename):
            return None

        plain_text = self.normalize_plain_text(raw_bytes.decode("utf-8-sig", errors="ignore"))
        if not plain_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded document is empty after normalization.",
            )
        created = self.repository.create_document(
            name=filename,
            title=filename,
            plain_text=plain_text,
            document_type=document_type,
            status="ready",
            updated_at=utc_now_iso(),
        )
        self.repository.replace_chunks(created["id"], self.chunk_plain_text(plain_text))
        return self._to_document_item(created)

    def delete_documents(self, ids: list[str]) -> None:
        self.repository.delete_documents(ids)

    def normalize_plain_text(self, text: str) -> str:
        return text.replace("\r\n", "\n").replace("\r", "\n").replace("\ufeff", "").strip()

    def detect_document_type(self, *, filename: str, content_type: str | None) -> str:
        lower_name = filename.lower()
        lower_content_type = (content_type or "").lower()
        if lower_name.endswith((".md", ".markdown")) or "markdown" in lower_content_type:
            return "markdown"
        if lower_name.endswith(".txt") or lower_content_type in {"", "text/plain"}:
            return "txt"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only TXT and Markdown uploads are supported.",
        )

    def chunk_plain_text(self, plain_text: str) -> list[str]:
        if not plain_text:
            return []
        chunk_size = max(1, self.settings.chunk_size)
        overlap = max(0, min(self.settings.chunk_overlap, chunk_size - 1))
        step = max(1, chunk_size - overlap)
        chunks: list[str] = []
        start = 0
        while start < len(plain_text):
            chunk = plain_text[start : start + chunk_size].strip()
            if chunk:
                chunks.append(chunk)
            if start + chunk_size >= len(plain_text):
                break
            start += step
        return chunks

    def _to_document_item(self, row: dict) -> DocumentItem:
        return DocumentItem(
            id=row["id"],
            name=row["name"],
            title=row["title"],
            plainText=row["plain_text"],
            type=row["doc_type"],
            status=row["status"],
            updatedAt=row["updated_at"],
        )
