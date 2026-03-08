import asyncio
import os
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.datastructures import UploadFile as StarletteUploadFile

from app.core.config import get_settings
from app.core.database import Database
from app.main import create_app
from app.api.v1.endpoints.chat import get_chat_service
from app.api.v1.endpoints.system import get_system_service
from app.repositories.chat_repo import ChatRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.system_repo import SystemRepository
from app.schemas.chat import ChatCompletionRequest
from app.schemas.documents import DocumentCreateRequest
from app.schemas.system import (
    LLMConfigCreateRequest,
    LLMConfigTestRequest,
    LLMConfigUpdateRequest,
)
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.llm_gateway import LLMGateway
from app.services.rag_service import RAGService
from app.services.system_service import SystemService


class FakeLLMGateway(LLMGateway):
    def generate(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str:
        chunk_count = len(relevant_chunks)
        history_count = len(recent_messages)
        return (
            f"[{config['provider']}/{config['model_name']}] "
            f"{message} | chunks={chunk_count} | history={history_count}"
        )

    def generate_stream(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ):
        full = self.generate(
            config=config,
            message=message,
            relevant_chunks=relevant_chunks,
            recent_messages=recent_messages,
        )
        yield full

    def test_connection(self, *, config: dict) -> str:
        return f"ok:{config['provider']}:{config['model_name']}"


class FailingLLMGateway(LLMGateway):
    def generate(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str:
        raise AssertionError("generate should not be called in connectivity test")

    def generate_stream(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ):
        raise AssertionError(
            "generate_stream should not be called in connectivity test"
        )

    def test_connection(self, *, config: dict) -> str:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach upstream model provider: connection refused",
        )


class FakeVectorStore:
    def __init__(self) -> None:
        self.added_chunks: list[dict] = []
        self.deleted_document_ids: list[str] = []
        self.search_calls: list[dict] = []

    def add_chunks(
        self,
        *,
        document_id: str,
        name: str,
        title: str,
        chunks: list[str],
    ) -> None:
        self.added_chunks.append(
            {
                "document_id": document_id,
                "name": name,
                "title": title,
                "chunks": chunks,
            }
        )

    def delete_by_document_ids(self, document_ids: list[str]) -> None:
        self.deleted_document_ids.extend(document_ids)

    def has_documents(self, document_ids: list[str]) -> bool:
        return bool(document_ids)

    def similarity_search(
        self,
        *,
        query: str,
        document_ids: list[str],
        k: int = 5,
    ) -> list[dict]:
        self.search_calls.append(
            {
                "query": query,
                "document_ids": document_ids,
                "k": k,
            }
        )
        return [
            {
                "content": "这是来自向量检索的语义命中片段。",
                "document_id": document_ids[0],
                "name": "vector.txt",
                "title": "Vector Result",
                "chunk_index": 0,
            }
        ]


class BackendServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test.db"
        os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{self.database_path}"
        os.environ["CHUNK_SIZE"] = "24"
        os.environ["CHUNK_OVERLAP"] = "4"
        os.environ["USE_VECTOR_SEARCH"] = "false"
        get_settings.cache_clear()

        settings = get_settings()
        self.database = Database(settings.database_url)
        self.database.initialize()
        self.document_repository = DocumentRepository(self.database)
        self.chat_repository = ChatRepository(self.database)
        self.system_repository = SystemRepository(self.database)
        self.document_service = DocumentService(self.document_repository, settings)
        self.system_service = SystemService(self.system_repository, settings)
        self.chat_service = ChatService(
            chat_repository=self.chat_repository,
            document_repository=self.document_repository,
            rag_service=RAGService(),
            system_repository=self.system_repository,
            llm_gateway=FakeLLMGateway(),
        )

    def tearDown(self) -> None:
        get_settings.cache_clear()
        os.environ.pop("DATABASE_URL", None)
        os.environ.pop("CHUNK_SIZE", None)
        os.environ.pop("CHUNK_OVERLAP", None)
        os.environ.pop("USE_VECTOR_SEARCH", None)
        self.temp_dir.cleanup()

    def test_settings_load_from_environment(self) -> None:
        settings = get_settings()
        self.assertEqual(settings.database_url, f"sqlite+aiosqlite:///{self.database_path}")
        self.assertEqual(settings.chunk_size, 24)
        self.assertEqual(settings.chunk_overlap, 4)

    def test_upload_mineru_file_without_token_returns_503(self) -> None:
        """上传 PDF 等 MinerU 格式但未配置 MINERU_API_TOKEN 时返回 503。"""
        uf = StarletteUploadFile(filename="sample.pdf", file=BytesIO(b"%PDF-1.4 minimal"))

        async def run() -> None:
            with self.assertRaises(HTTPException) as ctx:
                await self.document_service.ingest_uploaded_file(uf)
            self.assertEqual(ctx.exception.status_code, 503)
            # 若修改 MinerU 未配置时的错误文案（app.services.document_service），需同步更新此处断言。
            self.assertIn("MINERU_API_TOKEN", str(ctx.exception.detail))

        asyncio.run(run())

    def test_upload_normalizes_text_and_skips_duplicate_names(self) -> None:
        first = self.document_service.ingest_uploaded_bytes(
            filename="note.md",
            content_type="text/markdown",
            raw_bytes="\ufeff# Title\r\n\r\nBody".encode("utf-8"),
        )
        second = self.document_service.ingest_uploaded_bytes(
            filename="note.md",
            content_type="text/markdown",
            raw_bytes="# Changed".encode("utf-8"),
        )

        self.assertIsNotNone(first)
        self.assertIsNone(second)
        documents = self.document_service.list_documents()
        self.assertEqual(len(documents), 1)
        self.assertEqual(documents[0].plain_text, "# Title\n\nBody")
        self.assertEqual(documents[0].type, "markdown")

    def test_create_text_document_returns_frontend_shape(self) -> None:
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Manual note",
                plainText="line1\r\nline2",
                type="txt",
            )
        )

        self.assertEqual(document.name, "Manual note.txt")
        self.assertEqual(document.title, "Manual note")
        self.assertEqual(document.plain_text, "line1\nline2")
        self.assertEqual(document.status, "ready")

    def test_document_service_syncs_vector_chunks_on_create_and_delete(self) -> None:
        vector_store = FakeVectorStore()
        service = DocumentService(
            self.document_repository,
            get_settings(),
            vector_store=vector_store,
        )

        document = service.create_document_from_text(
            DocumentCreateRequest(
                title="Vector note",
                plainText="第一段内容。第二段内容。",
                type="txt",
            )
        )

        self.assertEqual(len(vector_store.added_chunks), 1)
        self.assertEqual(vector_store.added_chunks[0]["document_id"], document.id)
        self.assertEqual(vector_store.added_chunks[0]["title"], "Vector note")
        self.assertTrue(vector_store.added_chunks[0]["chunks"])

        service.delete_documents([document.id])
        self.assertEqual(vector_store.deleted_document_ids, [document.id])

    def test_chat_completion_persists_session_and_matches_contract(self) -> None:
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Project brief",
                plainText="FastAPI backend supports document upload and question answering.",
                type="txt",
            )
        )

        first_response = self.chat_service.create_completion(
            ChatCompletionRequest(
                message="后端支持什么？",
                documents=[document],
            )
        )
        second_response = self.chat_service.create_completion(
            ChatCompletionRequest(
                message="再说一遍重点",
                documents=[document],
                sessionId=first_response.session_id,
            )
        )

        self.assertTrue(first_response.content)
        self.assertIsNotNone(first_response.session_id)
        self.assertEqual(second_response.session_id, first_response.session_id)
        self.assertIn(document.title, first_response.references)
        messages = self.chat_repository.list_messages(first_response.session_id, limit=10)
        self.assertEqual(len(messages), 4)

    def test_chat_uses_default_model_config_for_real_generation(self) -> None:
        config = self.system_service.create_llm_config(
            LLMConfigCreateRequest(
                name="OpenAI 默认模型",
                provider="openai",
                apiKey="sk-test",
                modelName="gpt-4o-mini",
                temperature=0.7,
                topP=0.9,
                maxTokens=1200,
                isDefault=True,
            )
        )
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Product brief",
                plainText="系统配置会影响聊天时选用的真实模型。",
                type="txt",
            )
        )

        response = self.chat_service.create_completion(
            ChatCompletionRequest(
                message="现在走的是哪个模型？",
                documents=[document],
            )
        )

        self.assertEqual(response.model_config_id, config.id)
        self.assertEqual(response.provider, "openai")
        self.assertEqual(response.model_name, "gpt-4o-mini")
        self.assertIn("现在走的是哪个模型？", response.content)

    def test_chat_sessions_endpoint_persists_full_frontend_shape(self) -> None:
        app = create_app()
        now = "2026-03-07T10:00:00+00:00"
        payload = [
            {
                "id": "chat-1",
                "title": "第一轮对话",
                "messages": [
                    {"id": "m-1", "role": "user", "content": "你好"},
                    {"id": "m-2", "role": "assistant", "content": "你好，有什么可以帮你？"},
                ],
                "loadedDocuments": [
                    {
                        "id": "doc-1",
                        "name": "guide.txt",
                        "title": "guide",
                        "plainText": "system sessions contract",
                        "type": "txt",
                        "status": "ready",
                        "updatedAt": now,
                    }
                ],
                "pendingDocuments": [],
                "currentModelConfigId": "cfg-1",
                "currentProvider": "openai",
                "currentModelName": "gpt-4o-mini",
                "createdAt": now,
                "updatedAt": now,
            }
        ]

        with TestClient(app) as client:
            put_response = client.put("/api/v1/chat/sessions", json=payload)
            self.assertEqual(put_response.status_code, 200)
            put_payload = put_response.json()
            self.assertEqual(len(put_payload), 1)
            self.assertEqual(put_payload[0]["messages"][0]["content"], "你好")
            self.assertEqual(put_payload[0]["loadedDocuments"][0]["name"], "guide.txt")
            self.assertEqual(put_payload[0]["currentModelConfigId"], "cfg-1")

            get_response = client.get("/api/v1/chat/sessions")
            self.assertEqual(get_response.status_code, 200)
            get_payload = get_response.json()
            self.assertEqual(get_payload[0]["currentProvider"], "openai")
            self.assertEqual(get_payload[0]["currentModelName"], "gpt-4o-mini")
            self.assertEqual(get_payload[0]["messages"][1]["role"], "assistant")

    def test_chat_completion_updates_session_snapshot_for_fetch(self) -> None:
        config = self.system_service.create_llm_config(
            LLMConfigCreateRequest(
                name="Claude 主模型",
                provider="claude",
                apiKey="sk-ant-test",
                modelName="claude-3-5-haiku-latest",
                temperature=0.5,
                topP=0.8,
                maxTokens=1800,
                isDefault=True,
            )
        )
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Session sync",
                plainText="聊天完成后应该能从 sessions 接口读到已加载文档和模型信息。",
                type="txt",
            )
        )

        response = self.chat_service.create_completion(
            ChatCompletionRequest(
                message="sessions 接口会返回什么？",
                documents=[document],
                modelConfigId=config.id,
            )
        )

        sessions = self.chat_repository.list_sessions()
        self.assertEqual(len(sessions), 1)
        session = sessions[0]
        self.assertEqual(session["current_provider"], "claude")
        self.assertEqual(session["current_model_name"], "claude-3-5-haiku-latest")
        self.assertEqual(session["current_model_config_id"], config.id)
        self.assertIn(document.name, session["loaded_documents"])
        self.assertEqual(response.provider, "claude")

    def test_chat_prefers_vector_search_when_available(self) -> None:
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Semantic note",
                plainText="这是一段普通文本，不包含特别的关键词。",
                type="txt",
            )
        )
        vector_store = FakeVectorStore()
        chat_service = ChatService(
            chat_repository=self.chat_repository,
            document_repository=self.document_repository,
            rag_service=RAGService(vector_store=vector_store),
            system_repository=self.system_repository,
            llm_gateway=FakeLLMGateway(),
        )

        response = chat_service.create_completion(
            ChatCompletionRequest(
                message="帮我做语义检索测试",
                documents=[document],
            )
        )

        self.assertEqual(len(vector_store.search_calls), 1)
        self.assertEqual(vector_store.search_calls[0]["document_ids"], [document.id])
        self.assertIn("Vector Result", response.references)
        self.assertIn("语义命中片段", response.content)

    def test_chat_completion_endpoint_contract(self) -> None:
        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="API spec",
                plainText="POST /api/v1/chat/completions returns a content field.",
                type="txt",
            )
        )
        app = create_app()

        with TestClient(app) as client:
            response = client.post(
                "/api/v1/chat/completions",
                json={
                    "message": "接口返回什么字段？",
                    "documents": [document.model_dump(by_alias=True)],
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("content", payload)
        self.assertIn("sessionId", payload)
        self.assertIn("createdAt", payload)
        self.assertIn("references", payload)

    def test_chat_completion_stream_endpoint_returns_sse(self) -> None:
        import json as json_module

        document = self.document_service.create_document_from_text(
            DocumentCreateRequest(
                title="Stream spec",
                plainText="流式接口返回 SSE，最后一条为 done。",
                type="txt",
            )
        )
        app = create_app()

        with TestClient(app) as client:
            response = client.post(
                "/api/v1/chat/completions/stream",
                json={
                    "message": "流式输出测试",
                    "documents": [document.model_dump(by_alias=True)],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers.get("content-type", ""))
        text = response.text
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        data_lines = [l[6:] for l in lines if l.startswith("data: ")]
        self.assertGreater(len(data_lines), 0)
        content_found = False
        done_found = False
        for data in data_lines:
            try:
                event = json_module.loads(data)
            except json_module.JSONDecodeError:
                continue
            if "content" in event:
                content_found = True
            if event.get("done") is True:
                done_found = True
                self.assertIn("sessionId", event)
        self.assertTrue(content_found, "expected at least one content event")
        self.assertTrue(done_found, "expected a done event")

    def test_system_service_crud_and_secret_retention(self) -> None:
        created = self.system_service.create_llm_config(
            LLMConfigCreateRequest(
                name="OpenAI 主模型",
                provider="openai",
                apiKey="sk-test",
                modelName="gpt-4o-mini",
                temperature=0.7,
                topP=0.9,
                maxTokens=2000,
                isDefault=True,
            )
        )

        self.assertTrue(created.has_api_key)
        self.assertTrue(created.is_default)
        self.assertEqual(created.provider, "openai")

        updated = self.system_service.update_llm_config(
            created.id,
            LLMConfigUpdateRequest(
                name="OpenAI 生产配置",
                apiKey=None,
                temperature=0.5,
                isDefault=True,
            ),
        )

        self.assertEqual(updated.name, "OpenAI 生产配置")
        self.assertTrue(updated.has_api_key)
        self.assertEqual(updated.temperature, 0.5)

        items = self.system_service.list_llm_configs()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].id, created.id)

        self.system_service.delete_llm_config(created.id)
        self.assertEqual(self.system_service.list_llm_configs(), [])

    def test_system_service_can_test_llm_connectivity(self) -> None:
        # 使用 .env.test 中的 TEST_LLM_* 配置（make test 会加载）
        provider = os.environ.get("TEST_LLM_PROVIDER", "openai")
        model_name = os.environ.get("TEST_LLM_MODEL_NAME", "gpt-4o-mini")
        api_base = os.environ.get("TEST_LLM_API_BASE") or None
        api_key = os.environ.get("TEST_LLM_API_KEY", "sk-test")

        response = self.system_service.test_llm_config(
            LLMConfigTestRequest(
                provider=provider,
                modelName=model_name,
                apiBase=api_base,
                apiKey=api_key,
            )
        )

        self.assertTrue(response.ok)
        self.assertIn(provider, response.detail)
        self.assertIn(model_name, response.detail)

    def test_system_service_reports_connectivity_failure_without_raising(self) -> None:
        failing_service = SystemService(
            self.system_repository,
            get_settings(),
            llm_gateway=FailingLLMGateway(),
        )

        response = failing_service.test_llm_config(
            LLMConfigTestRequest(
                provider="local",
                apiBase="http://127.0.0.1:11434/v1",
                modelName="qwen2.5:7b",
            )
        )

        self.assertFalse(response.ok)
        self.assertIn("connection refused", response.detail)

    def test_system_service_connectivity_uses_stored_key_when_config_id_provided(
        self,
    ) -> None:
        """When apiKey is omitted but configId is provided, backend uses stored key."""
        created = self.system_service.create_llm_config(
            LLMConfigCreateRequest(
                name="OpenAI 连通性测试用",
                provider="openai",
                apiKey="sk-stored-key-for-test",
                modelName="gpt-4o-mini",
                temperature=0.7,
                topP=0.9,
                maxTokens=2000,
                isDefault=False,
            )
        )
        try:
            service_with_fake_gateway = SystemService(
                self.system_repository,
                get_settings(),
                llm_gateway=FakeLLMGateway(),
            )
            response = service_with_fake_gateway.test_llm_config(
                LLMConfigTestRequest(
                    provider="openai",
                    modelName="gpt-4o-mini",
                    api_key=None,
                    config_id=created.id,
                )
            )

            self.assertTrue(response.ok)
            self.assertIn("openai", response.detail)
            self.assertIn("gpt-4o-mini", response.detail)
        finally:
            self.system_service.delete_llm_config(created.id)

    def test_system_service_connectivity_returns_404_when_config_id_not_found(
        self,
    ) -> None:
        from fastapi import status

        service_with_fake_gateway = SystemService(
            self.system_repository,
            get_settings(),
            llm_gateway=FakeLLMGateway(),
        )
        with self.assertRaises(HTTPException) as ctx:
            service_with_fake_gateway.test_llm_config(
                LLMConfigTestRequest(
                    provider="openai",
                    modelName="gpt-4o-mini",
                    api_key=None,
                    config_id="00000000-0000-0000-0000-000000000000",
                )
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found", ctx.exception.detail.lower())

    def test_system_endpoints_and_chat_model_metadata(self) -> None:
        app = create_app()

        settings = get_settings()
        fake_chat_service = ChatService(
            chat_repository=ChatRepository(Database(settings.database_url)),
            document_repository=DocumentRepository(Database(settings.database_url)),
            rag_service=RAGService(),
            system_repository=SystemRepository(Database(settings.database_url)),
            llm_gateway=FakeLLMGateway(),
        )
        fake_system_service = SystemService(
            SystemRepository(Database(settings.database_url)),
            settings,
            llm_gateway=FakeLLMGateway(),
        )
        app.dependency_overrides[get_chat_service] = lambda: fake_chat_service
        app.dependency_overrides[get_system_service] = lambda: fake_system_service

        with TestClient(app) as client:
            providers_response = client.get("/api/v1/system/providers")
            self.assertEqual(providers_response.status_code, 200)
            self.assertIn("openai", providers_response.json()["items"])

            create_response = client.post(
                "/api/v1/system/llm-configs",
                json={
                    "name": "Claude 配置",
                    "provider": "claude",
                    "apiKey": "sk-ant-test",
                    "modelName": "claude-3-5-haiku-latest",
                    "temperature": 0.5,
                    "topP": 0.8,
                    "maxTokens": 1800,
                    "isDefault": True,
                },
            )
            self.assertEqual(create_response.status_code, 201)
            config_payload = create_response.json()
            self.assertEqual(config_payload["provider"], "claude")
            self.assertTrue(config_payload["hasApiKey"])
            self.assertNotIn("apiKey", config_payload)

            list_response = client.get("/api/v1/system/llm-configs")
            self.assertEqual(list_response.status_code, 200)
            self.assertEqual(len(list_response.json()["items"]), 1)

            test_response = client.post(
                "/api/v1/system/llm-configs/test",
                json={
                    "provider": "claude",
                    "apiKey": "sk-ant-test",
                    "modelName": "claude-3-5-haiku-latest",
                },
            )
            self.assertEqual(test_response.status_code, 200)
            test_payload = test_response.json()
            self.assertTrue(test_payload["ok"])
            self.assertIn("claude", test_payload["detail"])

            document = self.document_service.create_document_from_text(
                DocumentCreateRequest(
                    title="模型路由说明",
                    plainText="聊天接口会根据模型配置回显 provider 和 modelName。",
                    type="txt",
                )
            )
            chat_response = client.post(
                "/api/v1/chat/completions",
                json={
                    "message": "当前使用的模型是什么？",
                    "documents": [document.model_dump(by_alias=True)],
                    "modelConfigId": config_payload["id"],
                },
            )
            self.assertEqual(chat_response.status_code, 200)
            chat_payload = chat_response.json()
            self.assertEqual(chat_payload["modelConfigId"], config_payload["id"])
            self.assertEqual(chat_payload["provider"], "claude")
            self.assertEqual(chat_payload["modelName"], "claude-3-5-haiku-latest")
            self.assertIn("当前使用的模型是什么？", chat_payload["content"])

            delete_response = client.delete(
                f"/api/v1/system/llm-configs/{config_payload['id']}"
            )
            self.assertEqual(delete_response.status_code, 204)
        app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
