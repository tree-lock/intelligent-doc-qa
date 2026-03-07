import uuid

from app.core.database import Database


class DocumentRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    def list_documents(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT id, name, title, plain_text, doc_type, status, updated_at
                FROM documents
                ORDER BY updated_at DESC, name ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def get_by_name(self, name: str) -> dict | None:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                SELECT id, name, title, plain_text, doc_type, status, updated_at
                FROM documents
                WHERE name = ?
                """,
                (name,),
            ).fetchone()
        return dict(row) if row else None

    def create_document(
        self,
        *,
        name: str,
        title: str,
        plain_text: str,
        document_type: str,
        status: str,
        updated_at: str,
    ) -> dict:
        document_id = str(uuid.uuid4())
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO documents (id, name, title, plain_text, doc_type, status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (document_id, name, title, plain_text, document_type, status, updated_at),
            )
        return {
            "id": document_id,
            "name": name,
            "title": title,
            "plain_text": plain_text,
            "doc_type": document_type,
            "status": status,
            "updated_at": updated_at,
        }

    def replace_chunks(self, document_id: str, chunks: list[str]) -> None:
        with self.database.connect() as connection:
            connection.execute(
                "DELETE FROM document_chunks WHERE document_id = ?",
                (document_id,),
            )
            for index, content in enumerate(chunks):
                connection.execute(
                    """
                    INSERT INTO document_chunks (id, document_id, chunk_index, content)
                    VALUES (?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), document_id, index, content),
                )

    def list_chunks(self, document_ids: list[str]) -> list[dict]:
        if not document_ids:
            return []
        placeholders = ", ".join("?" for _ in document_ids)
        with self.database.connect() as connection:
            rows = connection.execute(
                f"""
                SELECT
                    c.id,
                    c.document_id,
                    c.chunk_index,
                    c.content,
                    d.name,
                    d.title,
                    d.doc_type
                FROM document_chunks c
                JOIN documents d ON d.id = c.document_id
                WHERE c.document_id IN ({placeholders})
                ORDER BY d.updated_at DESC, c.chunk_index ASC
                """,
                document_ids,
            ).fetchall()
        return [dict(row) for row in rows]

    def delete_documents(self, ids: list[str]) -> None:
        if not ids:
            return
        placeholders = ", ".join("?" for _ in ids)
        with self.database.connect() as connection:
            connection.execute(
                f"DELETE FROM documents WHERE id IN ({placeholders})",
                ids,
            )
