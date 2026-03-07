"""LangChain-based vector store for semantic retrieval."""

import logging
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Manages document chunk embeddings in Chroma for similarity search."""

    def __init__(
        self,
        *,
        persist_directory: str | Path,
        embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    ) -> None:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma

        self._persist_dir = Path(persist_directory)
        self._persist_dir.mkdir(parents=True, exist_ok=True)
        self._embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self._collection_name = "doc_qa_chunks"
        self._chroma_cls = Chroma
        self._store = None

    def _get_store(self):
        if self._store is None:
            self._store = self._chroma_cls(
                collection_name=self._collection_name,
                embedding_function=self._embeddings,
                persist_directory=str(self._persist_dir),
            )
        return self._store

    def add_chunks(
        self,
        *,
        document_id: str,
        name: str,
        title: str,
        chunks: list[str],
    ) -> None:
        """Add document chunks to the vector store, replacing any existing chunks for this document."""
        if not chunks:
            return
        self.delete_by_document_ids([document_id])
        store = self._get_store()
        texts = chunks
        metadatas = [
            {
                "document_id": document_id,
                "chunk_index": i,
                "name": name,
                "title": title,
            }
            for i in range(len(chunks))
        ]
        store.add_texts(texts=texts, metadatas=metadatas, ids=[f"{document_id}_{i}" for i in range(len(chunks))])

    def delete_by_document_ids(self, document_ids: list[str]) -> None:
        """Remove all chunks for the given document IDs."""
        if not document_ids:
            return
        store = self._get_store()
        collection = store._collection
        for doc_id in document_ids:
            results = collection.get(
                where={"document_id": doc_id},
                include=[],
            )
            if results and results["ids"]:
                collection.delete(ids=results["ids"])

    def similarity_search(
        self,
        *,
        query: str,
        document_ids: list[str],
        k: int = 5,
    ) -> list[dict]:
        """
        Search for chunks similar to the query, restricted to the given documents.
        Returns chunks in the format expected by RAG: content, document_id, name, title, chunk_index.
        """
        if not document_ids:
            return []
        store = self._get_store()
        where = {"document_id": {"$in": document_ids}}
        docs = store.similarity_search(query, k=k, filter=where)
        return [
            {
                "content": doc.page_content,
                "document_id": doc.metadata.get("document_id", ""),
                "name": doc.metadata.get("name", ""),
                "title": doc.metadata.get("title", ""),
                "chunk_index": doc.metadata.get("chunk_index", 0),
            }
            for doc in docs
        ]

    def has_documents(self, document_ids: list[str]) -> bool:
        """Check if any chunks exist for the given document IDs."""
        if not document_ids:
            return False
        store = self._get_store()
        collection = store._collection
        for doc_id in document_ids:
            results = collection.get(
                where={"document_id": doc_id},
                include=[],
                limit=1,
            )
            if results and results["ids"]:
                return True
        return False


@lru_cache(maxsize=4)
def get_vector_store_service(
    *,
    enabled: bool,
    persist_directory: str,
    embedding_model: str,
) -> VectorStoreService | None:
    if not enabled:
        return None
    try:
        return VectorStoreService(
            persist_directory=persist_directory,
            embedding_model=embedding_model,
        )
    except Exception as exc:
        logger.warning(
            "Vector search disabled because vector store initialization failed: %s",
            exc,
        )
        return None
