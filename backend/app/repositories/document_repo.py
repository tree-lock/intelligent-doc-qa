from app.schemas.documents import DocumentDetailResponse, DocumentItem


class DocumentRepository:
    """In-memory repository placeholder for MVP stage."""

    def __init__(self) -> None:
        self._items: list[DocumentItem] = []
        self._details: dict[str, DocumentDetailResponse] = {}

    def add(self, item: DocumentDetailResponse) -> None:
        self._items.append(
            DocumentItem(id=item.id, filename=item.filename, created_at=item.created_at)
        )
        self._details[str(item.id)] = item

    def list(self) -> list[DocumentItem]:
        return self._items

    def get(self, document_id: str) -> DocumentDetailResponse | None:
        return self._details.get(document_id)

    def delete(self, document_id: str) -> bool:
        detail = self._details.pop(document_id, None)
        if detail is None:
            return False
        self._items = [it for it in self._items if str(it.id) != document_id]
        return True
