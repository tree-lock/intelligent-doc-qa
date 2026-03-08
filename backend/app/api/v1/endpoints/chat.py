import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.core.database import Database
from app.repositories.chat_repo import ChatRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.system_repo import SystemRepository
from app.schemas.chat import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatSessionItem,
)
from app.services.chat_session_service import ChatSessionService
from app.services.chat_service import ChatService
from app.services.rag_service import RAGService
from app.services.vector_store_service import get_vector_store_service

router = APIRouter(prefix="/chat", tags=["chat"])


def get_chat_service() -> ChatService:
    settings = get_settings()
    database = Database(settings.database_url)
    vector_store = get_vector_store_service(
        enabled=settings.use_vector_search,
        persist_directory=settings.chroma_persist_path,
        embedding_model=settings.embedding_model,
    )
    return ChatService(
        chat_repository=ChatRepository(database),
        document_repository=DocumentRepository(database),
        rag_service=RAGService(vector_store=vector_store),
        system_repository=SystemRepository(database),
    )


def get_chat_session_service() -> ChatSessionService:
    settings = get_settings()
    database = Database(settings.database_url)
    return ChatSessionService(ChatRepository(database))


@router.post("/completions", response_model=ChatCompletionResponse)
def create_completion(
    payload: ChatCompletionRequest,
    service: ChatService = Depends(get_chat_service),
) -> ChatCompletionResponse:
    return service.create_completion(payload)


def _stream_completion_events(payload: ChatCompletionRequest, service: ChatService):
    try:
        for event in service.create_completion_stream(payload):
            line = f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            yield line.encode("utf-8")
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        yield f"data: {json.dumps({'error': detail}, ensure_ascii=False)}\n\n".encode(
            "utf-8"
        )
    except Exception as exc:
        error_message = str(exc) if str(exc) else "流式响应出错"
        yield f"data: {json.dumps({'error': error_message}, ensure_ascii=False)}\n\n".encode(
            "utf-8"
        )


@router.post("/completions/stream")
def create_completion_stream(
    payload: ChatCompletionRequest,
    service: ChatService = Depends(get_chat_service),
):
    return StreamingResponse(
        _stream_completion_events(payload, service),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions", response_model=list[ChatSessionItem])
def list_chat_sessions(
    service: ChatSessionService = Depends(get_chat_session_service),
) -> list[ChatSessionItem]:
    return service.list_sessions()


@router.put("/sessions", response_model=list[ChatSessionItem])
def persist_chat_sessions(
    payload: list[ChatSessionItem],
    service: ChatSessionService = Depends(get_chat_session_service),
) -> list[ChatSessionItem]:
    return service.persist_sessions(payload)
