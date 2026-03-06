from datetime import datetime
from uuid import uuid4

from app.providers.base import ProviderAdapter
from app.repositories.session_repo import SessionRepository
from app.schemas.chat import (
    ChatCompletionResponse,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
)


class ChatService:
    def __init__(self, repo: SessionRepository, provider: ProviderAdapter) -> None:
        self.repo = repo
        self.provider = provider

    def complete(self, question: str, session_id: str | None = None) -> ChatCompletionResponse:
        now = datetime.utcnow()
        if session_id:
            session = self.repo.get(session_id)
        else:
            session = None

        if session is None:
            session = ChatSessionDetailResponse(
                id=uuid4(),
                title=question[:30] or "New chat",
                updated_at=now,
                messages=[],
            )

        answer = self.provider.chat(question)
        session.messages.append({"role": "user", "content": question})
        session.messages.append({"role": "assistant", "content": answer})
        session.updated_at = now
        self.repo.upsert(session)

        return ChatCompletionResponse(
            session_id=session.id,
            answer=answer,
            created_at=now,
        )

    def list_sessions(self) -> ChatSessionListResponse:
        return ChatSessionListResponse(items=self.repo.list())

    def get_session(self, session_id: str) -> ChatSessionDetailResponse | None:
        return self.repo.get(session_id)
