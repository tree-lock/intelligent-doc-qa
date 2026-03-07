import sqlite3
from contextlib import contextmanager
from pathlib import Path


def resolve_sqlite_path(database_url: str) -> Path:
    supported_prefixes = ("sqlite+aiosqlite:///", "sqlite:///")
    for prefix in supported_prefixes:
        if database_url.startswith(prefix):
            raw_path = database_url[len(prefix) :]
            if raw_path.startswith("/"):
                return Path(raw_path)
            return Path.cwd() / raw_path
    raise ValueError(f"Unsupported database url: {database_url}")


class Database:
    def __init__(self, database_url: str) -> None:
        self.path = resolve_sqlite_path(database_url)

    @contextmanager
    def connect(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    plain_text TEXT NOT NULL,
                    doc_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS document_chunks (
                    id TEXT PRIMARY KEY,
                    document_id TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    loaded_documents TEXT NOT NULL DEFAULT '[]',
                    pending_documents TEXT NOT NULL DEFAULT '[]',
                    current_model_config_id TEXT,
                    current_provider TEXT NOT NULL DEFAULT '',
                    current_model_name TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS llm_configs (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    api_key TEXT NOT NULL DEFAULT '',
                    api_base TEXT NOT NULL DEFAULT '',
                    model_name TEXT NOT NULL,
                    temperature REAL NOT NULL,
                    top_p REAL NOT NULL,
                    max_tokens INTEGER NOT NULL,
                    is_default INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )
            self._ensure_column(
                connection,
                table_name="chat_sessions",
                column_name="loaded_documents",
                definition="TEXT NOT NULL DEFAULT '[]'",
            )
            self._ensure_column(
                connection,
                table_name="chat_sessions",
                column_name="pending_documents",
                definition="TEXT NOT NULL DEFAULT '[]'",
            )
            self._ensure_column(
                connection,
                table_name="chat_sessions",
                column_name="current_model_config_id",
                definition="TEXT",
            )
            self._ensure_column(
                connection,
                table_name="chat_sessions",
                column_name="current_provider",
                definition="TEXT NOT NULL DEFAULT ''",
            )
            self._ensure_column(
                connection,
                table_name="chat_sessions",
                column_name="current_model_name",
                definition="TEXT NOT NULL DEFAULT ''",
            )

    def _ensure_column(
        self,
        connection: sqlite3.Connection,
        *,
        table_name: str,
        column_name: str,
        definition: str,
    ) -> None:
        rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
        existing_columns = {row["name"] for row in rows}
        if column_name in existing_columns:
            return
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"
        )
