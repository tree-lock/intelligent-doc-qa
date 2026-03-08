# 智能文档问答助手 — 使用文档

本文档说明如何安装、启动和日常使用智能文档问答助手（本地开发与 Docker 部署）。

## 1. 前置要求

- **本地开发**：Node 运行环境（推荐 [Bun](https://bun.sh)）、Python 3.12+、可选 Docker
- **仅 Docker 运行**：安装 [Docker](https://docs.docker.com/get-docker/) 与 [Docker Compose](https://docs.docker.com/compose/install/)

## 2. 快速启动（Docker，推荐）

在项目根目录执行：

```bash
docker compose up --build
```

启动完成后：

- **前端**：浏览器访问 `http://127.0.0.1:80`
- **后端**：`http://127.0.0.1:8000`
- **后端 API 文档**：`http://127.0.0.1:8000/api/v1/docs`

仅启动后端或仅启动前端：

```bash
# 仅后端
docker compose up --build backend

# 仅前端（需保证后端地址正确）
docker compose up --build frontend
```

前端容器构建时可指定后端 API 地址，例如生产环境：

```bash
VITE_API_BASE_URL=http://your-backend-host:8000 docker compose up --build frontend
```

## 3. 本地开发

### 3.1 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

或使用 Makefile：

```bash
cd backend
make install
cp .env.example .env
make dev
```

后端启动后：

- 健康检查：`http://127.0.0.1:8000/api/v1/health`
- Swagger：`http://127.0.0.1:8000/api/v1/docs`
- OpenAPI JSON：`http://127.0.0.1:8000/api/v1/openapi.json`

### 3.2 前端

```bash
cd frontend
bun install   # 或 npm install
bun run dev
```

按终端输出的本地地址访问（通常为 `http://localhost:5173`）。前端通过环境变量 `VITE_API_BASE_URL` 连接后端，默认 `http://localhost:8000`，可在 `frontend/.env` 或 `.env.local` 中修改。

### 3.3 与后端联调

- 先启动后端，再启动前端
- 确保 `VITE_API_BASE_URL` 指向实际后端地址（如 `http://127.0.0.1:8000`）
- 文档、会话、系统配置均通过后端 API，无需额外 mock

## 4. 环境变量

### 4.1 后端（backend/.env）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_NAME` | 应用名 | `Doc QA Backend` |
| `APP_VERSION` | 应用版本 | `0.1.0` |
| `API_PREFIX` | API 前缀 | `/api/v1` |
| `DATABASE_URL` | 数据库连接 | `sqlite+aiosqlite:///./doc_qa.db` |
| `CORS_ALLOWED_ORIGINS` | 前端来源白名单 | `["http://localhost:5173","http://127.0.0.1:5173"]` |
| `CHUNK_SIZE` | 文档切块大小 | `800` |
| `CHUNK_OVERLAP` | 切块重叠 | `120` |
| `chroma_persist_path` | Chroma 向量库目录 | `./data/chroma` |
| `mineru_api_token` | MinerU 解析 Token（可选） | 空 |

MinerU Token 也可在系统配置页中设置，用于支持 PDF、Word、PPT、图片、HTML 等格式上传。

### 4.2 前端（frontend/.env 或 .env.local）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 基地址 | `http://localhost:8000` |

## 5. 基本使用流程

1. **配置 AI 模型**（系统配置页 `/settings`）  
   添加至少一个模型配置（如 OpenAI 或 Claude），填写 API Key、模型名等，可点击「测试连通性」确认可用。若未配置任何模型，问答会回退到本地可解释摘要模式。

2. **上传文档**（文档管理页 `/`）  
   拖拽或点击上传 TXT、Markdown 文件；若已配置 MinerU Token，可上传 PDF、Word 等。也可在部分流程中通过「直接提交文本」创建文档。

3. **发起问答**（Agent 问答页 `/chat`）  
   在文档管理页勾选文档后点击「开启新对话」，或进入 `/chat` 后通过侧边栏「添加文档」选择已上传文档。在输入框输入问题并发送，支持多轮对话；可切换当前会话使用的模型配置。

4. **管理会话**  
   左侧展示最近会话列表，点击可切换；会话与消息由后端持久化，刷新页面后仍可继续对话。

## 6. 测试

### 6.1 后端单元测试

```bash
cd backend
make test
```

或手动：

```bash
cd backend
source .venv/bin/activate
make install-dev
python -m unittest discover -s tests -p "test_*.py" -v
```

### 6.2 前端单元测试

```bash
cd frontend
bun run test
```

## 7. 常见问题

**Q：上传 PDF/Word 提示需要配置？**  
A：在系统配置页设置 MinerU Token，或在后端环境变量中配置 `mineru_api_token`。仅 TXT、Markdown 无需 Token。

**Q：聊天没有真实 AI 回复？**  
A：请在系统配置页添加并保存至少一个可用的模型配置（如 OpenAI、Claude），并确保 API Key 正确；可先用「测试连通性」验证。

**Q：前端无法连接后端？**  
A：检查后端是否已启动、端口是否为 8000；检查前端 `VITE_API_BASE_URL` 是否与后端地址一致；若跨域，确认后端 `CORS_ALLOWED_ORIGINS` 包含前端访问来源。

**Q：Docker 下前端访问后端 404？**  
A：前端构建时需将 `VITE_API_BASE_URL` 设为容器内可访问的后端地址（如 `http://backend:8000`），再执行 `docker compose up --build frontend`。

更多接口与错误码说明见 [接口文档](./API.md)，架构说明见 [架构设计文档](./ARCHITECTURE.md)。**部署到服务器**时请阅读 [服务器部署注意事项](./DEPLOYMENT.md)。
