import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import Database
from app.services.vector_store_service import get_vector_store_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    Database(settings.database_url).initialize()

    # 启动时预热向量服务与嵌入模型，避免首次文档/聊天请求卡顿
    if settings.use_vector_search:
        try:
            vector_store = get_vector_store_service(
                enabled=True,
                persist_directory=settings.chroma_persist_path,
                embedding_model=settings.embedding_model,
            )
            if vector_store is not None:
                vector_store._get_store()
                logger.info("Vector store and embedding model warmed up at startup.")
        except Exception as exc:
            logger.warning(
                "Vector store warmup skipped (will load on first use): %s",
                exc,
            )

    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def read_root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "docs": f"{settings.api_prefix}/docs",
        }

    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
