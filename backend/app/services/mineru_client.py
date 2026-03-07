"""MinerU API 客户端，用于解析 PDF、Word、PPT、图片、HTML 等非文本文档为 Markdown。

参考：https://github.com/tree-lock/ai-study-practice-assistance
API 文档：https://mineru.net/apiManage
"""

import asyncio
import zipfile
from io import BytesIO
from typing import Literal

import httpx

MINERU_BASE = "https://mineru.net/api/v4"
MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200MB
MAX_FILES_PER_BATCH = 200
SUPPORTED_EXTENSIONS = (
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".html",
)

MINERU_ERROR_MESSAGES: dict[str, str] = {
    "A0202": "Token 错误，请检查 .env 中的 MINERU_API_TOKEN",
    "A0211": "Token 已过期，请更换新 Token",
    "-500": "传参错误，请检查参数格式",
    "-10001": "MinerU 服务异常，请稍后再试",
    "-10002": "请求参数错误，请检查格式",
    "-60001": "生成上传链接失败，请稍后再试",
    "-60002": "文件格式不支持，请使用 PDF、Word、PPT、图片或 HTML",
    "-60003": "文件读取失败，请检查文件是否损坏",
    "-60004": "空文件，请上传有效文件",
    "-60005": "文件大小超出限制（最大 200MB）",
    "-60006": "文件页数超过限制（最大 600 页）",
    "-60007": "模型服务暂时不可用，请稍后再试",
    "-60008": "文件读取超时，请检查网络",
    "-60009": "任务队列已满，请稍后再试",
    "-60010": "解析失败，请稍后再试",
    "-60011": "获取有效文件失败，请确保文件已上传",
    "-60012": "找不到任务，请重试",
    "-60013": "没有权限访问该任务",
    "-60014": "运行中的任务暂不支持删除",
    "-60015": "文件转换失败，可尝试转为 PDF 后上传",
    "-60016": "文件格式转换失败，请重试",
    "-60017": "重试次数已达上限，请稍后再试",
    "-60018": "每日解析任务数量已达上限，明日再来",
    "-60019": "HTML 解析额度不足，明日再来",
    "-60020": "文件拆分失败，请稍后再试",
    "-60021": "读取文件页数失败，请稍后再试",
    "-60022": "网页读取失败，请稍后再试",
}

MinerUFileState = Literal[
    "waiting-file", "pending", "running", "done", "failed", "converting"
]
MinerUModelVersion = Literal["pipeline", "vlm", "MinerU-HTML"]


def _get_error_message(code: int | str, default_msg: str) -> str:
    key = str(code)
    return MINERU_ERROR_MESSAGES.get(key, default_msg)


def is_mineru_supported(filename: str) -> bool:
    """判断文件是否可由 MinerU 解析。"""
    ext = filename.lower()[filename.rfind(".") :] if "." in filename else ""
    return ext in SUPPORTED_EXTENSIONS


def validate_mineru_file(filename: str, size: int) -> None:
    """校验 MinerU 文件，不符合则抛出 ValueError。"""
    if not is_mineru_supported(filename):
        raise ValueError(
            f'文件 "{filename}" 格式不支持，支持格式：PDF、Word、PPT、图片、HTML'
        )
    if size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f'文件 "{filename}" 超过 200MB 限制')


def _auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "*/*",
    }


async def apply_upload_urls(
    token: str,
    files: list[dict[str, str]],
    model_version: MinerUModelVersion = "vlm",
) -> tuple[str, list[str]]:
    """申请批量上传链接，返回 (batch_id, urls)。"""
    if len(files) > MAX_FILES_PER_BATCH:
        raise ValueError(f"单次最多上传 {MAX_FILES_PER_BATCH} 个文件")

    payload = {
        "files": [{"name": f["name"]} for f in files],
        "model_version": model_version,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{MINERU_BASE}/file-urls/batch",
            headers=_auth_headers(token),
            json=payload,
        )
        data = resp.json()

    if data.get("code") != 0 or not data.get("data"):
        msg = data.get("msg", "申请上传链接失败")
        err = _get_error_message(data.get("code", ""), msg)
        raise RuntimeError(err)

    batch_id = data["data"]["batch_id"]
    urls = data["data"]["file_urls"]
    return batch_id, urls


async def upload_file_to_url(url: str, bytes_content: bytes) -> None:
    """将文件 PUT 到预签名 URL。"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.put(url, content=bytes_content)
        if not resp.is_success:
            raise RuntimeError(f"上传文件失败: HTTP {resp.status_code}")


async def get_batch_extract_results(
    token: str, batch_id: str
) -> list[dict]:
    """获取批量解析结果。"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{MINERU_BASE}/extract-results/batch/{batch_id}",
            headers=_auth_headers(token),
        )
        data = resp.json()

    if data.get("code") != 0 or not data.get("data"):
        msg = data.get("msg", "获取解析结果失败")
        err = _get_error_message(data.get("code", ""), msg)
        raise RuntimeError(err)

    return data["data"]["extract_result"]


def _is_batch_complete(items: list[dict]) -> tuple[bool, bool]:
    """返回 (all_done, all_success)。"""
    terminal = {"done", "failed"}
    all_done = all(item.get("state") in terminal for item in items)
    failed = [i for i in items if i.get("state") == "failed"]
    all_success = all_done and len(failed) == 0
    return all_done, all_success


async def fetch_zip_and_extract_markdown(zip_url: str) -> str:
    """从 ZIP URL 下载并提取 Markdown 内容。"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.get(zip_url)
        if not resp.is_success:
            raise RuntimeError(f"下载解析结果失败: HTTP {resp.status_code}")

        zip_bytes = resp.content

    with zipfile.ZipFile(BytesIO(zip_bytes), "r") as zf:
        md_names = sorted(n for n in zf.namelist() if n.endswith(".md"))
        parts: list[str] = []
        for name in md_names:
            with zf.open(name) as f:
                text = f.read().decode("utf-8", errors="replace")
                if text.strip():
                    parts.append(text)

    return "\n\n---\n\n".join(parts)


async def parse_with_mineru(
    token: str,
    filename: str,
    raw_bytes: bytes,
    poll_interval: float = 2.0,
    poll_timeout: float = 300.0,
) -> str:
    """使用 MinerU 解析单个文件，返回 Markdown 文本。

    流程：申请上传链接 -> 上传文件 -> 轮询解析结果 -> 下载 ZIP -> 提取 Markdown
    """
    validate_mineru_file(filename, len(raw_bytes))

    has_html = filename.lower().endswith(".html")
    model_version: MinerUModelVersion = "MinerU-HTML" if has_html else "vlm"

    batch_id, urls = await apply_upload_urls(
        token, [{"name": filename}], model_version=model_version
    )
    await upload_file_to_url(urls[0], raw_bytes)

    elapsed = 0.0
    while elapsed < poll_timeout:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

        items = await get_batch_extract_results(token, batch_id)
        all_done, all_success = _is_batch_complete(items)

        if not all_success and all_done:
            failed = next((i for i in items if i.get("state") == "failed"), None)
            err_msg = failed.get("err_msg", "解析失败") if failed else "解析失败"
            raise RuntimeError(f'MinerU 解析 "{filename}" 失败: {err_msg}')

        if all_success:
            item = items[0]
            zip_url = item.get("full_zip_url")
            if not zip_url:
                raise RuntimeError(f'MinerU 未返回 "{filename}" 的解析结果')
            return await fetch_zip_and_extract_markdown(zip_url)

    raise TimeoutError(f'MinerU 解析 "{filename}" 超时（{poll_timeout}s）')
