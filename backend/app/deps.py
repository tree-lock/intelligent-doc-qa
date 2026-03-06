from app.core.config import settings
from app.providers.base import EchoProviderAdapter
from app.repositories.config_repo import ConfigRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.session_repo import SessionRepository
from app.services.chat_service import ChatService
from app.services.config_service import ConfigService
from app.services.document_service import DocumentService

document_repo = DocumentRepository()
session_repo = SessionRepository()
config_repo = ConfigRepository(
    default_provider=settings.default_provider,
    vector_store=settings.vector_store,
)

document_service = DocumentService(document_repo)
chat_service = ChatService(session_repo, EchoProviderAdapter())
config_service = ConfigService(config_repo)
