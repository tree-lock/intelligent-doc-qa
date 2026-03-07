import uuid

from app.core.database import Database


class SystemRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    def list_llm_configs(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT
                    id,
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    is_default,
                    created_at,
                    updated_at
                FROM llm_configs
                ORDER BY is_default DESC, updated_at DESC, name ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def get_llm_config(self, config_id: str) -> dict | None:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                SELECT
                    id,
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    is_default,
                    created_at,
                    updated_at
                FROM llm_configs
                WHERE id = ?
                """,
                (config_id,),
            ).fetchone()
        return dict(row) if row else None

    def get_default_llm_config(self) -> dict | None:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                SELECT
                    id,
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    is_default,
                    created_at,
                    updated_at
                FROM llm_configs
                WHERE is_default = 1
                ORDER BY updated_at DESC
                LIMIT 1
                """
            ).fetchone()
        return dict(row) if row else None

    def create_llm_config(
        self,
        *,
        name: str,
        provider: str,
        api_key: str,
        api_base: str,
        model_name: str,
        temperature: float,
        top_p: float,
        max_tokens: int,
        is_default: bool,
        created_at: str,
    ) -> dict:
        config_id = str(uuid.uuid4())
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO llm_configs (
                    id,
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    is_default,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    config_id,
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    int(is_default),
                    created_at,
                    created_at,
                ),
            )
        return self.get_llm_config(config_id) or {}

    def update_llm_config(
        self,
        *,
        config_id: str,
        name: str,
        provider: str,
        api_key: str,
        api_base: str,
        model_name: str,
        temperature: float,
        top_p: float,
        max_tokens: int,
        is_default: bool,
        updated_at: str,
    ) -> dict | None:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE llm_configs
                SET
                    name = ?,
                    provider = ?,
                    api_key = ?,
                    api_base = ?,
                    model_name = ?,
                    temperature = ?,
                    top_p = ?,
                    max_tokens = ?,
                    is_default = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    name,
                    provider,
                    api_key,
                    api_base,
                    model_name,
                    temperature,
                    top_p,
                    max_tokens,
                    int(is_default),
                    updated_at,
                    config_id,
                ),
            )
        return self.get_llm_config(config_id)

    def clear_default_flags(self, keep_config_id: str | None = None) -> None:
        query = "UPDATE llm_configs SET is_default = 0"
        parameters: tuple[str, ...] = ()
        if keep_config_id is not None:
            query += " WHERE id != ?"
            parameters = (keep_config_id,)
        with self.database.connect() as connection:
            connection.execute(query, parameters)

    def delete_llm_config(self, config_id: str) -> None:
        with self.database.connect() as connection:
            connection.execute("DELETE FROM llm_configs WHERE id = ?", (config_id,))

    def get_system_setting(self, key: str) -> str | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT value FROM system_settings WHERE key = ?",
                (key,),
            ).fetchone()
        return row["value"] if row and row["value"] else None

    def set_system_setting(self, key: str, value: str) -> None:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO system_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )
