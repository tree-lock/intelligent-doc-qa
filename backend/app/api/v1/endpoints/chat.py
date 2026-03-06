from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.deps import chat_service
from app.schemas.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
)

router = APIRouter()


@router.post("/completions", response_model=ChatCompletionResponse)
def complete_chat(payload: ChatCompletionRequest) -> ChatCompletionResponse:
    return chat_service.complete(
        question=payload.question,
        session_id=str(payload.session_id) if payload.session_id else None,
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions() -> ChatSessionListResponse:
    return chat_service.list_sessions()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session(session_id: UUID) -> ChatSessionDetailResponse:
    session = chat_service.get_session(str(session_id))
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
