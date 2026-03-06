from app.schemas.chat import ChatSessionDetailResponse, ChatSessionItem


class SessionRepository:
    """In-memory repository placeholder for MVP stage."""

    def __init__(self) -> None:
        self._sessions: dict[str, ChatSessionDetailResponse] = {}

    def list(self) -> list[ChatSessionItem]:
        return [
            ChatSessionItem(id=v.id, title=v.title, updated_at=v.updated_at)
            for v in self._sessions.values()
        ]

    def get(self, session_id: str) -> ChatSessionDetailResponse | None:
        return self._sessions.get(session_id)

    def upsert(self, session: ChatSessionDetailResponse) -> None:
        self._sessions[str(session.id)] = session
