# Backend README

## 1. 项目定位

`backend` 是智能文档问答助手的 API 服务，职责包括：

- 文档管理：上传、查询、删除
- Agent 问答：基于文档检索 + 生成（RAG）
- 系统配置：Provider 与向量存储配置管理

服务基于 `FastAPI`，并按 `api/service/repository` 分层组织，便于后续接入真实向量库与多 Provider。

## 2. 技术栈

- `Python`
- `FastAPI`
- `Pydantic Settings`
- `LangChain`（依赖已引入，可用于后续问答链路增强）

## 3. 本地开发

### 3.1 方式一：使用 Makefile（推荐）

```bash
make install
make dev
```

### 3.2 方式二：手动命令

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3.3 Docker 运行

在仓库根目录执行：

```bash
docker compose up --build backend
```

服务地址：

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/api/v1/docs`

## 4. 环境变量

可参考 `./.env.example`：

- `APP_NAME`
- `APP_VERSION`
- `API_PREFIX`（默认 `/api/v1`）
- `DEFAULT_PROVIDER`（默认 `openai`）
- `VECTOR_STORE`（默认 `faiss`）
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

## 5. API 文档与健康检查

- Swagger UI：`http://127.0.0.1:8000/api/v1/docs`
- OpenAPI JSON：`http://127.0.0.1:8000/api/v1/openapi.json`
- 健康检查：`GET /api/v1/health`

## 6. 主要接口分组

### Documents API

- `POST /api/v1/documents`
- `GET /api/v1/documents`
- `GET /api/v1/documents/{document_id}`
- `DELETE /api/v1/documents/{document_id}`

### Chat API

- `POST /api/v1/chat/completions`
- `GET /api/v1/chat/sessions`
- `GET /api/v1/chat/sessions/{session_id}`

### System API

- `GET /api/v1/system/providers`
- `GET /api/v1/system/config`
- `PUT /api/v1/system/config`

## 7. 与前端对接

前端通过环境变量 `VITE_API_BASE_URL` 指定后端地址，默认 `http://localhost:8000`。本地联调时：

1. 先启动 backend（端口 8000）
2. 再启动 frontend，确保 `VITE_API_BASE_URL` 指向 backend

前端 API 封装层（`frontend/src/lib/api/`）当前为本地存储 + Mock，对接时需替换为对下列接口的 HTTP 调用。

## 8. 目录结构

```text
backend/
  app/
    api/               # FastAPI 路由层
    schemas/           # 请求/响应模型
    services/          # 业务服务
    repositories/      # 数据访问层
    providers/         # Provider 适配器抽象与实现
    core/              # 配置、通用能力
```
