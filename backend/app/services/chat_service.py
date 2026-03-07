import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.repositories.chat_repo import ChatRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.system_repo import SystemRepository
from app.schemas.chat import ChatCompletionRequest, ChatCompletionResponse
from app.services.llm_gateway import HTTPModelGateway, LLMGateway
from app.services.rag_service import RAGService


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ChatService:
    def __init__(
        self,
        *,
        chat_repository: ChatRepository,
        document_repository: DocumentRepository,
        rag_service: RAGService,
        system_repository: SystemRepository | None = None,
        llm_gateway: LLMGateway | None = None,
    ) -> None:
        self.chat_repository = chat_repository
        self.document_repository = document_repository
        self.rag_service = rag_service
        self.system_repository = system_repository
        self.llm_gateway = llm_gateway or HTTPModelGateway()

    def create_completion(self, payload: ChatCompletionRequest) -> ChatCompletionResponse:
        session_id = payload.session_id or str(uuid.uuid4())
        session = self.chat_repository.get_session(session_id)
        created_at = utc_now_iso()

        if session is None:
            self.chat_repository.create_session(
                session_id=session_id,
                title=self._create_session_title(payload.message),
                created_at=created_at,
                loaded_documents=[
                    document.model_dump(by_alias=True) for document in payload.documents
                ],
                pending_documents=[],
            )

        recent_messages = self.chat_repository.list_messages(session_id)
        selected_chunks = self.document_repository.list_chunks(
            [document.id for document in payload.documents]
        )
        if not selected_chunks:
            selected_chunks = self._build_fallback_chunks(payload)

        relevant_chunks = self.rag_service.select_relevant_chunks(
            message=payload.message,
            chunks=selected_chunks,
        )
        references = self._collect_references(relevant_chunks)
        selected_model_config = self._resolve_llm_config(payload.model_config_id)
        if selected_model_config is None:
            content, references = self.rag_service.build_answer(
                message=payload.message,
                relevant_chunks=relevant_chunks,
                recent_messages=recent_messages,
            )
            model_config_id = payload.model_config_id
            provider = "local-rag"
            model_name = "extractive-summary"
        else:
            content = self.llm_gateway.generate(
                config=selected_model_config,
                message=payload.message,
                relevant_chunks=relevant_chunks,
                recent_messages=recent_messages,
            )
            model_config_id = str(selected_model_config["id"])
            provider = str(selected_model_config["provider"])
            model_name = str(selected_model_config["model_name"])

        self.chat_repository.add_message(
            session_id=session_id,
            role="user",
            content=payload.message,
            created_at=created_at,
        )
        assistant_created_at = utc_now_iso()
        self.chat_repository.add_message(
            session_id=session_id,
            role="assistant",
            content=content,
            created_at=assistant_created_at,
        )
        self.chat_repository.update_session(
            session_id=session_id,
            updated_at=assistant_created_at,
            loaded_documents=[
                document.model_dump(by_alias=True) for document in payload.documents
            ],
            pending_documents=[],
            current_model_config_id=model_config_id,
            current_provider=provider,
            current_model_name=model_name,
        )

        return ChatCompletionResponse(
            content=content,
            sessionId=session_id,
            createdAt=assistant_created_at,
            references=references,
            modelConfigId=model_config_id,
            provider=provider,
            modelName=model_name,
        )

    def _build_fallback_chunks(self, payload: ChatCompletionRequest) -> list[dict]:
        chunks: list[dict] = []
        for document in payload.documents:
            chunks.append(
                {
                    "document_id": document.id,
                    "chunk_index": 0,
                    "content": document.plain_text,
                    "name": document.name,
                    "title": document.title,
                    "doc_type": document.type,
                }
            )
        return chunks

    def _create_session_title(self, message: str) -> str:
        normalized = " ".join(message.strip().split())
        if not normalized:
            return "新对话"
        if len(normalized) <= 24:
            return normalized
        return f"{normalized[:24]}..."

    def _resolve_llm_config(self, model_config_id: str | None) -> dict | None:
        if self.system_repository is None:
            if model_config_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"LLM config '{model_config_id}' was not found.",
                )
            return None
        if model_config_id:
            config = self.system_repository.get_llm_config(model_config_id)
            if config is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"LLM config '{model_config_id}' was not found.",
                )
            return config
        default_config = self.system_repository.get_default_llm_config()
        if default_config is not None:
            return default_config
        configs = self.system_repository.list_llm_configs()
        return configs[0] if configs else None

    def _collect_references(self, relevant_chunks: list[dict]) -> list[str]:
        references: list[str] = []
        for chunk in relevant_chunks:
            reference = chunk.get("title") or chunk.get("name") or chunk.get("document_id")
            if isinstance(reference, str) and reference not in references:
                references.append(reference)
        return references
