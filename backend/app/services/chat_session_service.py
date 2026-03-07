import json

from app.repositories.chat_repo import ChatRepository
from app.schemas.chat import ChatMessageItem, ChatSessionItem
from app.schemas.documents import DocumentItem


class ChatSessionService:
    def __init__(self, repository: ChatRepository) -> None:
        self.repository = repository

    def list_sessions(self) -> list[ChatSessionItem]:
        sessions: list[ChatSessionItem] = []
        for row in self.repository.list_sessions():
            messages = self.repository.list_messages(row["id"], limit=0)
            sessions.append(self._to_session_item(row, messages))
        return sessions

    def persist_sessions(self, sessions: list[ChatSessionItem]) -> list[ChatSessionItem]:
        payload = [session.model_dump(by_alias=True) for session in sessions]
        self.repository.replace_sessions(payload)
        return self.list_sessions()

    def _to_session_item(
        self,
        row: dict,
        messages: list[dict],
    ) -> ChatSessionItem:
        loaded_documents_raw = self._parse_json_list(row.get("loaded_documents"))
        pending_documents_raw = self._parse_json_list(row.get("pending_documents"))
        return ChatSessionItem(
            id=row["id"],
            title=row["title"],
            messages=[
                ChatMessageItem(
                    id=message["id"],
                    role=message["role"],
                    content=message["content"],
                )
                for message in messages
            ],
            loadedDocuments=[
                DocumentItem.model_validate(item) for item in loaded_documents_raw
            ],
            pendingDocuments=[
                DocumentItem.model_validate(item) for item in pending_documents_raw
            ],
            currentModelConfigId=row.get("current_model_config_id"),
            currentProvider=row.get("current_provider") or "",
            currentModelName=row.get("current_model_name") or "",
            createdAt=row["created_at"],
            updatedAt=row["updated_at"],
        )

    def _parse_json_list(self, raw_value: str | None) -> list[dict]:
        if not raw_value:
            return []
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [item for item in parsed if isinstance(item, dict)]
