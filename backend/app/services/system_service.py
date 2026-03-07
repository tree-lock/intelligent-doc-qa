from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.config import Settings
from app.repositories.system_repo import SystemRepository
from app.schemas.system import (
    LLMConfigCreateRequest,
    LLMConfigItem,
    LLMConfigUpdateRequest,
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SystemService:
    def __init__(self, repository: SystemRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    def list_providers(self) -> list[str]:
        return self.settings.system_providers

    def list_llm_configs(self) -> list[LLMConfigItem]:
        return [self._to_item(row) for row in self.repository.list_llm_configs()]

    def get_llm_config_item(self, config_id: str) -> LLMConfigItem:
        row = self.repository.get_llm_config(config_id)
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"LLM config '{config_id}' was not found.",
            )
        return self._to_item(row)

    def create_llm_config(self, payload: LLMConfigCreateRequest) -> LLMConfigItem:
        normalized = self._validate_and_normalize(
            name=payload.name,
            provider=payload.provider,
            api_key=payload.api_key,
            api_base=payload.api_base,
            model_name=payload.model_name,
            temperature=payload.temperature,
            top_p=payload.top_p,
            max_tokens=payload.max_tokens,
            existing=None,
            is_default=payload.is_default,
        )
        created_at = utc_now_iso()
        if normalized["is_default"]:
            self.repository.clear_default_flags()
        row = self.repository.create_llm_config(
            name=normalized["name"],
            provider=normalized["provider"],
            api_key=normalized["api_key"],
            api_base=normalized["api_base"],
            model_name=normalized["model_name"],
            temperature=normalized["temperature"],
            top_p=normalized["top_p"],
            max_tokens=normalized["max_tokens"],
            is_default=normalized["is_default"],
            created_at=created_at,
        )
        return self._to_item(row)

    def update_llm_config(
        self, config_id: str, payload: LLMConfigUpdateRequest
    ) -> LLMConfigItem:
        existing = self.repository.get_llm_config(config_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"LLM config '{config_id}' was not found.",
            )

        normalized = self._validate_and_normalize(
            name=payload.name if payload.name is not None else existing["name"],
            provider=(
                payload.provider if payload.provider is not None else existing["provider"]
            ),
            api_key=payload.api_key,
            api_base=(
                payload.api_base if payload.api_base is not None else existing["api_base"]
            ),
            model_name=(
                payload.model_name
                if payload.model_name is not None
                else existing["model_name"]
            ),
            temperature=(
                payload.temperature
                if payload.temperature is not None
                else existing["temperature"]
            ),
            top_p=payload.top_p if payload.top_p is not None else existing["top_p"],
            max_tokens=(
                payload.max_tokens
                if payload.max_tokens is not None
                else existing["max_tokens"]
            ),
            existing=existing,
            is_default=(
                payload.is_default
                if payload.is_default is not None
                else bool(existing["is_default"])
            ),
        )
        if normalized["is_default"]:
            self.repository.clear_default_flags(keep_config_id=config_id)
        row = self.repository.update_llm_config(
            config_id=config_id,
            name=normalized["name"],
            provider=normalized["provider"],
            api_key=normalized["api_key"],
            api_base=normalized["api_base"],
            model_name=normalized["model_name"],
            temperature=normalized["temperature"],
            top_p=normalized["top_p"],
            max_tokens=normalized["max_tokens"],
            is_default=normalized["is_default"],
            updated_at=utc_now_iso(),
        )
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"LLM config '{config_id}' was not found.",
            )
        return self._to_item(row)

    def delete_llm_config(self, config_id: str) -> None:
        if self.repository.get_llm_config(config_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"LLM config '{config_id}' was not found.",
            )
        self.repository.delete_llm_config(config_id)

    def _validate_and_normalize(
        self,
        *,
        name: str,
        provider: str,
        api_key: str | None,
        api_base: str | None,
        model_name: str,
        temperature: float,
        top_p: float,
        max_tokens: int,
        existing: dict | None,
        is_default: bool = False,
    ) -> dict:
        normalized_name = name.strip()
        normalized_provider = provider.strip().lower()
        normalized_model_name = model_name.strip()
        normalized_api_base = (api_base or "").strip()
        normalized_api_key = (
            api_key.strip()
            if api_key is not None
            else (existing["api_key"] if existing is not None else "")
        )

        if not normalized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LLM config name cannot be empty.",
            )
        if normalized_provider not in self.settings.system_providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider '{normalized_provider}'.",
            )
        if not normalized_model_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LLM modelName cannot be empty.",
            )

        if normalized_provider in self.settings.remote_api_key_providers and not normalized_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{normalized_provider}' requires apiKey.",
            )
        if (
            normalized_provider in self.settings.api_base_required_providers
            and not normalized_api_base
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{normalized_provider}' requires apiBase.",
            )

        return {
            "name": normalized_name,
            "provider": normalized_provider,
            "api_key": normalized_api_key,
            "api_base": normalized_api_base,
            "model_name": normalized_model_name,
            "temperature": float(temperature),
            "top_p": float(top_p),
            "max_tokens": int(max_tokens),
            "is_default": bool(is_default),
        }

    def _to_item(self, row: dict) -> LLMConfigItem:
        return LLMConfigItem(
            id=row["id"],
            name=row["name"],
            provider=row["provider"],
            apiBase=row["api_base"] or "",
            modelName=row["model_name"],
            temperature=float(row["temperature"]),
            topP=float(row["top_p"]),
            maxTokens=int(row["max_tokens"]),
            isDefault=bool(row["is_default"]),
            hasApiKey=bool(row["api_key"]),
            createdAt=row["created_at"],
            updatedAt=row["updated_at"],
        )
