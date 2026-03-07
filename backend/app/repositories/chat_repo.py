import uuid
import json

from app.core.database import Database


class ChatRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    def get_session(self, session_id: str) -> dict | None:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                SELECT
                    id,
                    title,
                    loaded_documents,
                    pending_documents,
                    current_model_config_id,
                    current_provider,
                    current_model_name,
                    created_at,
                    updated_at
                FROM chat_sessions
                WHERE id = ?
                """,
                (session_id,),
            ).fetchone()
        return dict(row) if row else None

    def create_session(
        self,
        *,
        session_id: str,
        title: str,
        created_at: str,
        loaded_documents: list[dict] | None = None,
        pending_documents: list[dict] | None = None,
        current_model_config_id: str | None = None,
        current_provider: str = "",
        current_model_name: str = "",
    ) -> dict:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO chat_sessions (
                    id,
                    title,
                    loaded_documents,
                    pending_documents,
                    current_model_config_id,
                    current_provider,
                    current_model_name,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    title,
                    json.dumps(loaded_documents or [], ensure_ascii=False),
                    json.dumps(pending_documents or [], ensure_ascii=False),
                    current_model_config_id,
                    current_provider,
                    current_model_name,
                    created_at,
                    created_at,
                ),
            )
        return self.get_session(session_id) or {}

    def update_session(
        self,
        *,
        session_id: str,
        updated_at: str,
        title: str | None = None,
        loaded_documents: list[dict] | None = None,
        pending_documents: list[dict] | None = None,
        current_model_config_id: str | None = None,
        current_provider: str | None = None,
        current_model_name: str | None = None,
    ) -> None:
        fields = ["updated_at = ?"]
        values: list[object] = [updated_at]
        if title is not None:
            fields.append("title = ?")
            values.append(title)
        if loaded_documents is not None:
            fields.append("loaded_documents = ?")
            values.append(json.dumps(loaded_documents, ensure_ascii=False))
        if pending_documents is not None:
            fields.append("pending_documents = ?")
            values.append(json.dumps(pending_documents, ensure_ascii=False))
        if current_model_config_id is not None:
            fields.append("current_model_config_id = ?")
            values.append(current_model_config_id)
        if current_provider is not None:
            fields.append("current_provider = ?")
            values.append(current_provider)
        if current_model_name is not None:
            fields.append("current_model_name = ?")
            values.append(current_model_name)
        values.append(session_id)
        with self.database.connect() as connection:
            connection.execute(
                f"""
                UPDATE chat_sessions
                SET {", ".join(fields)}
                WHERE id = ?
                """,
                values,
            )

    def list_sessions(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT
                    id,
                    title,
                    loaded_documents,
                    pending_documents,
                    current_model_config_id,
                    current_provider,
                    current_model_name,
                    created_at,
                    updated_at
                FROM chat_sessions
                ORDER BY updated_at DESC, created_at DESC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def replace_sessions(self, sessions: list[dict]) -> None:
        with self.database.connect() as connection:
            connection.execute("DELETE FROM chat_sessions")
            for session in sessions:
                connection.execute(
                    """
                    INSERT INTO chat_sessions (
                        id,
                        title,
                        loaded_documents,
                        pending_documents,
                        current_model_config_id,
                        current_provider,
                        current_model_name,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session["id"],
                        session["title"],
                        json.dumps(session.get("loadedDocuments", []), ensure_ascii=False),
                        json.dumps(session.get("pendingDocuments", []), ensure_ascii=False),
                        session.get("currentModelConfigId"),
                        session.get("currentProvider", ""),
                        session.get("currentModelName", ""),
                        session["createdAt"],
                        session["updatedAt"],
                    ),
                )
                for message in session.get("messages", []):
                    connection.execute(
                        """
                        INSERT INTO chat_messages (id, session_id, role, content, created_at)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            message["id"],
                            session["id"],
                            message["role"],
                            message["content"],
                            session["updatedAt"],
                        ),
                    )

    def add_message(
        self,
        *,
        session_id: str,
        role: str,
        content: str,
        created_at: str,
    ) -> dict:
        message_id = str(uuid.uuid4())
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO chat_messages (id, session_id, role, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (message_id, session_id, role, content, created_at),
            )
        return {
            "id": message_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "created_at": created_at,
        }

    def list_messages(self, session_id: str, limit: int = 8) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT id, session_id, role, content, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
                """,
                (session_id,),
            ).fetchall()
        items = [dict(row) for row in rows]
        if limit <= 0:
            return items
        return items[-limit:]
