from fastapi import APIRouter, Depends

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
