import re


TOKEN_PATTERN = re.compile(r"[0-9A-Za-z\u4e00-\u9fff]+")


def tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in TOKEN_PATTERN.finditer(text)]


class RAGService:
    def select_relevant_chunks(
        self,
        *,
        message: str,
        chunks: list[dict],
        limit: int = 3,
    ) -> list[dict]:
        query_terms = set(tokenize(message))
        if not chunks:
            return []

        scored: list[tuple[int, int, dict]] = []
        for index, chunk in enumerate(chunks):
            chunk_terms = set(tokenize(chunk["content"]))
            overlap = len(query_terms & chunk_terms)
            contains_query = 1 if message.strip().lower() in chunk["content"].lower() else 0
            score = overlap * 10 + contains_query
            scored.append((score, -index, chunk))

        scored.sort(reverse=True)
        selected = [item[2] for item in scored[:limit] if item[0] > 0]
        if selected:
            return selected
        return chunks[:limit]

    def build_answer(
        self,
        *,
        message: str,
        relevant_chunks: list[dict],
        recent_messages: list[dict],
    ) -> tuple[str, list[str]]:
        if not relevant_chunks:
            return (
                "当前没有找到可引用的文档内容。请先上传或勾选文档后再提问。",
                [],
            )

        references: list[str] = []
        excerpts: list[str] = []
        for chunk in relevant_chunks:
            reference = chunk.get("title") or chunk.get("name") or chunk["document_id"]
            if reference not in references:
                references.append(reference)
            excerpt = chunk["content"].strip().replace("\n", " ")
            excerpts.append(f"《{reference}》: {excerpt[:220]}")

        history_hint = ""
        previous_user_messages = [
            item["content"] for item in recent_messages if item["role"] == "user"
        ]
        if previous_user_messages:
            history_hint = (
                f"结合本会话之前的问题“{previous_user_messages[-1][:40]}”，"
                if previous_user_messages[-1] != message
                else ""
            )

        answer = (
            f"{history_hint}根据已选文档，和“{message}”最相关的内容如下：\n"
            + "\n".join(f"- {excerpt}" for excerpt in excerpts)
            + "\n\n"
            + "基于这些片段，可以先得到一个保守结论："
            + " 文档中已经覆盖了与你问题最接近的事实，请优先以上述引用内容为准。"
        )
        return answer, references
