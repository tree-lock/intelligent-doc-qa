# Backend README

## 1. 项目说明

`backend` 现在提供 P0 可运行后端，目标是先打通“上传文档 -> 入库 -> 提问 -> 返回答案”主链路，并严格对齐前端当前正在使用的契约。

本次实现对应需求条目：

- 核心功能-文档管理：支持 `TXT`、`Markdown` 上传解析与文档列表查询
- 核心功能-问答能力：基于已选文档做最小 RAG 回答，并支持 `sessionId` 多轮上下文
- 技术与架构要求：前后端分离、`api -> service -> repository` 分层
- 质量与工程要求：补充核心单测、支持本地启动与 Docker 启动

## 2. 当前 P0 能力

已实现：

- `GET /api/v1/documents`
- `POST /api/v1/documents`：直接提交纯文本
- `POST /api/v1/documents/upload`：上传 `TXT` / `Markdown`
- `DELETE /api/v1/documents`：按 `ids` 批量删除
- `POST /api/v1/chat/completions`
- `GET /api/v1/chat/sessions`
- `PUT /api/v1/chat/sessions`
- `GET /api/v1/system/providers`
- `GET /api/v1/system/llm-configs`
- `POST /api/v1/system/llm-configs`
- `PUT /api/v1/system/llm-configs/{id}`
- `DELETE /api/v1/system/llm-configs/{id}`
- `GET /api/v1/health`

当前行为：

- 只保存规范化后的纯文本，不保存原始文件
- 上传时会去掉 BOM、统一换行并裁剪首尾空白
- 按文件名去重；同名上传会被忽略
- 文档与聊天会话都持久化在 `SQLite`
- 聊天返回 `content`，并附带 `sessionId`、`createdAt`、`references`
- 系统配置支持多模型配置 CRUD，并以 `hasApiKey` 脱敏返回密钥状态
- 当聊天请求带 `modelConfigId` 时，后端会按配置真实调用对应模型，并在响应里回传实际使用的 `provider/modelName`
- `chat/sessions` 支持返回完整会话、消息、已加载文档、待加载文档和当前模型选择

当前限制：

- 文档格式只支持 `TXT` 与 `Markdown`
- 若未配置任何模型，聊天会回退到本地可解释摘要式 RAG

## 3. 技术栈

- `Python 3.12`
- `FastAPI`
- `Pydantic Settings`
- `SQLite`
- `python-multipart`
- `uvicorn`

## 4. 快速开始

### 4.1 本地启动

```bash
cd /Users/treezlock/code/work/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后可访问：

- `http://127.0.0.1:8000/api/v1/health`
- `http://127.0.0.1:8000/api/v1/docs`
- `http://127.0.0.1:8000/api/v1/redoc`
- `http://127.0.0.1:8000/api/v1/openapi.json`

### 4.2 使用 Makefile

```bash
cd /Users/treezlock/code/work/backend
make install
cp .env.example .env
make dev
```

### 4.3 Docker 启动

```bash
cd /Users/treezlock/code/work
docker compose up --build backend
```

## 5. 环境变量

可参考 `backend/.env.example`：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `APP_NAME` | 应用名 | `Doc QA Backend` |
| `APP_VERSION` | 应用版本 | `0.1.0` |
| `API_PREFIX` | API 前缀 | `/api/v1` |
| `DATABASE_URL` | SQLite 连接地址 | `sqlite+aiosqlite:///./doc_qa.db` |
| `CORS_ALLOWED_ORIGINS` | 前端来源白名单 | `["http://localhost:5173","http://127.0.0.1:5173"]` |
| `CHUNK_SIZE` | 文档切块大小 | `800` |
| `CHUNK_OVERLAP` | 文档切块重叠 | `120` |

## 6. 数据与分层

目录结构：

```text
backend/
  app/
    api/               # FastAPI 路由层
    core/              # 配置与数据库初始化
    repositories/      # SQLite 访问
    schemas/           # 请求/响应模型
    services/          # 文档处理、RAG、聊天编排
  tests/               # 单元测试
```

SQLite 表：

- `documents`：文档元数据与纯文本
- `document_chunks`：切块结果
- `chat_sessions`：会话元数据
- `chat_messages`：消息历史

数据流：

1. 上传文件或直接提交文本
2. 后端规范化文本并写入 `documents`
3. 服务层切块并写入 `document_chunks`
4. 提问时按已选文档检索相关片段
5. 生成带引用的最小 RAG 回答并持久化会话消息

## 7. API 契约

### 7.1 健康检查

- `GET /api/v1/health`

响应示例：

```json
{
  "ok": true,
  "app": "Doc QA Backend",
  "version": "0.1.0"
}
```

### 7.2 Documents API

- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `POST /api/v1/documents/upload`
- `DELETE /api/v1/documents`

`DocumentItem` 返回结构：

```json
{
  "id": "string",
  "name": "note.md",
  "title": "note.md",
  "plainText": "# Title\n\nBody",
  "type": "markdown",
  "status": "ready",
  "updatedAt": "2026-03-07T10:00:00+00:00"
}
```

### 7.3 Chat API

- `POST /api/v1/chat/completions`

请求示例：

```json
{
  "message": "后端支持什么能力？",
  "documents": [
    {
      "id": "doc-1",
      "name": "sample.txt",
      "title": "sample.txt",
      "plainText": "FastAPI backend supports document upload and chat answers.",
      "type": "txt",
      "status": "ready",
      "updatedAt": "2026-03-07T10:00:00+00:00"
    }
  ],
  "sessionId": "optional",
  "modelConfigId": "optional"
}
```

响应示例：

```json
{
  "content": "基于文档片段，后端已经支持文档上传、检索和问答主链路。",
  "sessionId": "optional",
  "createdAt": "2026-03-07T10:00:00+00:00",
  "references": ["sample.txt"],
  "modelConfigId": "cfg-123",
  "provider": "openai",
  "modelName": "gpt-4o-mini"
}
```

## 8. 测试

当前单测覆盖：

- 配置加载
- 文档文本规范化
- 上传去重
- 直接文本创建
- 聊天契约与会话持久化

运行方式：

```bash
cd /Users/treezlock/code/work/backend
source .venv/bin/activate
python -m unittest tests.test_services
```

## 9. 验证记录

本地已验证：

- 单测 `5/5` 通过
- `GET /api/v1/health` 正常返回
- `POST /api/v1/documents/upload` 可成功上传
- `POST /api/v1/chat/completions` 可返回 `content/sessionId/references`

Docker 验证依赖本机 Docker daemon；若本机已启动 Docker Desktop，可直接执行 `docker compose up --build backend` 复现。
