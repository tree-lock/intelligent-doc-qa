from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings
from app.repositories.document_repo import DocumentRepository
from app.repositories.system_repo import SystemRepository
from app.schemas.documents import DocumentCreateRequest, DocumentItem
from app.services.mineru_client import (
    is_mineru_supported,
    parse_with_mineru,
    validate_mineru_file,
)

if TYPE_CHECKING:
    from app.services.vector_store_service import VectorStoreService


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DocumentService:
    def __init__(
        self,
        repository: DocumentRepository,
        settings: Settings,
        vector_store: "VectorStoreService | None" = None,
        system_repository: SystemRepository | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings
        self.vector_store = vector_store
        self.system_repository = system_repository

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
        chunks = self.chunk_plain_text(normalized_text)
        self.repository.replace_chunks(created["id"], chunks)
        self._sync_vector_chunks(
            document_id=created["id"],
            name=name,
            title=title,
            chunks=chunks,
        )
        return self._to_document_item(created)

    async def upload_documents(self, files: list[UploadFile]) -> list[DocumentItem]:
        uploaded: list[DocumentItem] = []
        for file in files:
            created = await self.ingest_uploaded_file(file)
            if created is not None:
                uploaded.append(created)
        return uploaded

    async def ingest_uploaded_file(self, file: UploadFile) -> DocumentItem | None:
        filename = file.filename or "untitled.txt"
        raw_bytes = await file.read()

        if is_mineru_supported(filename):
            return await self._ingest_mineru_file(filename=filename, raw_bytes=raw_bytes)

        return self.ingest_uploaded_bytes(
            filename=filename,
            content_type=file.content_type,
            raw_bytes=raw_bytes,
        )

    def _get_mineru_token(self) -> str | None:
        """优先使用前端配置的 Token，否则使用环境变量。"""
        if self.system_repository:
            stored = self.system_repository.get_system_setting("mineru_api_token")
            if stored and stored.strip():
                return stored.strip()
        return (self.settings.mineru_api_token or "").strip() or None

    async def _ingest_mineru_file(
        self, *, filename: str, raw_bytes: bytes
    ) -> DocumentItem | None:
        """使用 MinerU 解析 PDF/Word/PPT/图片/HTML，转为 Markdown 后入库。"""
        token = self._get_mineru_token()
        if not token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="MinerU 解析服务未配置。请在系统配置页填写 MinerU API Token，或在 .env 中设置 MINERU_API_TOKEN。"
                "在 https://mineru.net/apiManage 申请 Token。",
            )
        try:
            validate_mineru_file(filename, len(raw_bytes))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e

        if self.repository.get_by_name(filename):
            return None

        try:
            plain_text = await parse_with_mineru(token, filename, raw_bytes)
        except (RuntimeError, TimeoutError) as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"MinerU 解析失败: {e}",
            ) from e

        normalized = self.normalize_plain_text(plain_text)
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MinerU 解析结果为空，请检查文件内容。",
            )

        created = self.repository.create_document(
            name=filename,
            title=filename,
            plain_text=normalized,
            document_type="markdown",
            status="ready",
            updated_at=utc_now_iso(),
        )
        chunks = self.chunk_plain_text(normalized)
        self.repository.replace_chunks(created["id"], chunks)
        self._sync_vector_chunks(
            document_id=created["id"],
            name=filename,
            title=filename,
            chunks=chunks,
        )
        return self._to_document_item(created)

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
        chunks = self.chunk_plain_text(plain_text)
        self.repository.replace_chunks(created["id"], chunks)
        self._sync_vector_chunks(
            document_id=created["id"],
            name=filename,
            title=filename,
            chunks=chunks,
        )
        return self._to_document_item(created)

    def delete_documents(self, ids: list[str]) -> None:
        if self.vector_store is not None and ids:
            self.vector_store.delete_by_document_ids(ids)
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
            detail="不支持的文件格式。支持：TXT、Markdown；配置 MINERU_API_TOKEN 后还可支持 PDF、Word、PPT、图片、HTML。",
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

    def _sync_vector_chunks(
        self,
        *,
        document_id: str,
        name: str,
        title: str,
        chunks: list[str],
    ) -> None:
        if self.vector_store is None:
            return
        self.vector_store.add_chunks(
            document_id=document_id,
            name=name,
            title=title,
            chunks=chunks,
        )

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
