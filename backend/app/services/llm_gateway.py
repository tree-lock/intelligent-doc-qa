import json
from typing import Protocol
from urllib import error, request

from fastapi import HTTPException, status


class LLMGateway(Protocol):
    def generate(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str: ...

    def test_connection(self, *, config: dict) -> str: ...


class HTTPModelGateway:
    def test_connection(self, *, config: dict) -> str:
        probe_config = dict(config)
        probe_config["temperature"] = float(config.get("temperature", 0))
        probe_config["top_p"] = float(config.get("top_p", 1))
        probe_config["max_tokens"] = int(config.get("max_tokens", 32))
        return self.generate(
            config=probe_config,
            message="请仅回复 OK。",
            relevant_chunks=[],
            recent_messages=[],
        )

    def generate(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str:
        provider = str(config["provider"]).lower()
        if provider == "claude":
            return self._call_claude(
                config=config,
                message=message,
                relevant_chunks=relevant_chunks,
                recent_messages=recent_messages,
            )
        if provider in {"openai", "local", "community"}:
            return self._call_openai_compatible(
                config=config,
                message=message,
                relevant_chunks=relevant_chunks,
                recent_messages=recent_messages,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider '{provider}' is not supported for chat completions.",
        )

    def _call_openai_compatible(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str:
        provider = str(config["provider"]).lower()
        endpoint = self._resolve_openai_endpoint(
            provider=provider,
            api_base=str(config.get("api_base") or ""),
        )
        messages = self._build_openai_messages(
            message=message,
            relevant_chunks=relevant_chunks,
            recent_messages=recent_messages,
        )
        payload = {
            "model": config["model_name"],
            "messages": messages,
            "temperature": float(config["temperature"]),
            "top_p": float(config["top_p"]),
            "max_tokens": int(config["max_tokens"]),
        }
        headers = {"Content-Type": "application/json"}
        api_key = str(config.get("api_key") or "").strip()
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        body = self._post_json(endpoint=endpoint, payload=payload, headers=headers)

        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI-compatible provider returned an unexpected response.",
            ) from exc
        return self._normalize_message_content(content)

    def _call_claude(
        self,
        *,
        config: dict,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> str:
        endpoint = self._resolve_claude_endpoint(api_base=str(config.get("api_base") or ""))
        system_prompt = self._build_system_prompt()
        messages = self._build_anthropic_messages(
            message=message,
            relevant_chunks=relevant_chunks,
            recent_messages=recent_messages,
        )
        payload = {
            "model": config["model_name"],
            "system": system_prompt,
            "messages": messages,
            "temperature": float(config["temperature"]),
            "top_p": float(config["top_p"]),
            "max_tokens": int(config["max_tokens"]),
        }
        headers = {
            "Content-Type": "application/json",
            "x-api-key": str(config.get("api_key") or ""),
            "anthropic-version": "2023-06-01",
        }
        body = self._post_json(endpoint=endpoint, payload=payload, headers=headers)

        try:
            content_blocks = body["content"]
        except (KeyError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Claude provider returned an unexpected response.",
            ) from exc

        text_parts = [
            str(block.get("text", ""))
            for block in content_blocks
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        content = "\n".join(part for part in text_parts if part.strip()).strip()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Claude provider returned an empty completion.",
            )
        return content

    def _post_json(self, *, endpoint: str, payload: dict, headers: dict[str, str]) -> dict:
        req = request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=45) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="ignore")
            detail = error_body or str(exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Upstream model request failed: {detail}",
            ) from exc
        except error.URLError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to reach upstream model provider: {exc.reason}",
            ) from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Upstream model provider returned invalid JSON.",
            ) from exc

    def _build_openai_messages(
        self,
        *,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = [{"role": "system", "content": self._build_system_prompt()}]
        for item in recent_messages[-6:]:
            if item.get("role") in {"user", "assistant"}:
                messages.append(
                    {
                        "role": str(item["role"]),
                        "content": str(item["content"]),
                    }
                )
        messages.append(
            {
                "role": "user",
                "content": self._build_user_prompt(
                    message=message,
                    relevant_chunks=relevant_chunks,
                ),
            }
        )
        return messages

    def _build_anthropic_messages(
        self,
        *,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        for item in recent_messages[-6:]:
            if item.get("role") in {"user", "assistant"}:
                messages.append(
                    {
                        "role": str(item["role"]),
                        "content": str(item["content"]),
                    }
                )
        messages.append(
            {
                "role": "user",
                "content": self._build_user_prompt(
                    message=message,
                    relevant_chunks=relevant_chunks,
                ),
            }
        )
        return messages

    def _build_system_prompt(self) -> str:
        return (
            "你是一个文档问答助手。"
            "请优先依据提供的文档片段和会话上下文回答，使用简体中文。"
            "如果文档里没有足够依据，请明确说明不确定，不要编造。"
        )

    def _build_user_prompt(self, *, message: str, relevant_chunks: list[dict]) -> str:
        context_blocks: list[str] = []
        for chunk in relevant_chunks:
            title = chunk.get("title") or chunk.get("name") or chunk.get("document_id", "unknown")
            excerpt = str(chunk.get("content", "")).strip()
            context_blocks.append(f"[{title}]\n{excerpt}")
        context = "\n\n".join(context_blocks) if context_blocks else "没有可用的文档片段。"
        return (
            "请基于以下文档片段回答问题。\n\n"
            f"文档片段：\n{context}\n\n"
            f"用户问题：\n{message}\n\n"
            "回答要求：\n"
            "1. 先给出直接结论。\n"
            "2. 仅在文档依据范围内回答。\n"
            "3. 如果信息不足，请明确说明。"
        )

    def _resolve_openai_endpoint(self, *, provider: str, api_base: str) -> str:
        normalized_base = api_base.strip()
        if not normalized_base and provider == "openai":
            normalized_base = "https://api.openai.com/v1"
        if not normalized_base:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{provider}' requires apiBase for chat completions.",
            )
        normalized_base = normalized_base.rstrip("/")
        if normalized_base.endswith("/chat/completions"):
            return normalized_base
        return f"{normalized_base}/chat/completions"

    def _resolve_claude_endpoint(self, *, api_base: str) -> str:
        normalized_base = api_base.strip() or "https://api.anthropic.com"
        normalized_base = normalized_base.rstrip("/")
        if normalized_base.endswith("/v1/messages"):
            return normalized_base
        return f"{normalized_base}/v1/messages"

    def _normalize_message_content(self, content: object) -> str:
        if isinstance(content, str):
            normalized = content.strip()
            if normalized:
                return normalized
        if isinstance(content, list):
            text_parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    text_value = item.get("text")
                    if isinstance(text_value, str) and text_value.strip():
                        text_parts.append(text_value.strip())
            if text_parts:
                return "\n".join(text_parts)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI-compatible provider returned an empty completion.",
        )
