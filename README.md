# 智能文档问答助手（架构设计 README）

## 1. 项目简介

智能文档问答助手是一个基于 AI 的文档问答系统，支持用户上传文档（TXT、Markdown），并通过自然语言提问获取答案。系统支持多轮对话与上下文保持，同时支持切换不同 AI 服务提供商（OpenAI、Claude、本地模型等）。

本 README 仅聚焦**技术选型、架构分层、模块边界和落地方式**，不展开复杂实现细节。

## 2. 功能范围

### 2.1 文档管理

- 上传文档：支持 `TXT`、`Markdown`
- 文档解析：抽取文本内容并切分为可检索片段
- 文档存储：保存文档元数据与索引数据
- 文档操作：查询、列表、删除

### 2.2 Agent 问答

- 基于文档内容进行问答（RAG）
- 生成准确、连贯的回答
- 支持多轮对话与上下文延续

### 2.3 系统配置

- 支持配置 AI Provider（OpenAI / Claude / 本地模型）
- 支持模型参数配置（如 model、temperature、max tokens）

### 2.4 UI 页面

- 文档管理页面（上传、列表、详情、删除）
- Agent 问答页面（会话列表、消息区、输入区）
- 系统配置页面（Provider、Key、默认模型）

## 3. 技术栈（仅列技术与用途）

### 前端

- `Bun`: 运行环境
- `React`：应用框架
- `Vite`：构建与开发环境
- `TailwindCSS`：样式系统
- `shadcn/ui`：基础 UI 组件
- `Zustand`：本地状态管理（会话状态、配置状态）
- `TanStack Query`：服务端数据请求与缓存
- `Biome`：格式化代码

### 后端

- `Python`：服务开发语言
- `FastAPI`：REST API 框架
- `LangChain`：问答链路编排（检索 + 生成）
- `OpenAPI`：接口定义与文档

## 4. 系统架构

```mermaid
flowchart LR
  user[User]
  fe[ReactFrontend]
  api[FastAPIBackend]
  qa[LangChainQAPipeline]
  provider[LLMProviderAdapter]
  meta[(DocMetadataStore)]
  vec[(VectorStore)]
  chat[(SessionStore)]

  user --> fe
  fe -->|HTTPJSON| api
  api --> qa
  qa --> provider
  qa --> vec
  api --> meta
  api --> chat
```

### 分层说明

- 前端层：页面渲染、交互、状态与请求管理
- API 层：统一接口、鉴权（可选）、参数校验、错误处理
- 业务层：文档处理、问答编排、会话管理、配置管理
- 存储层：文档元数据、向量索引、会话记录

## 5. 核心模块设计

### 5.1 文档管理模块

- **输入**：上传文件（TXT/MD）
- **处理**：解析文本 -> 文本切分 -> 向量化 -> 入库
- **输出**：文档列表、文档详情、删除结果
- **接口**：
  - `POST /api/v1/documents`
  - `GET /api/v1/documents`
  - `GET /api/v1/documents/{document_id}`
  - `DELETE /api/v1/documents/{document_id}`

### 5.2 Agent 问答与会话模块

- **输入**：用户问题、会话 ID（可选）
- **处理**：检索相关片段 -> 组装上下文 -> LLM 生成 -> 保存会话
- **输出**：回答文本、引用片段（可选）、会话上下文
- **接口**：
  - `POST /api/v1/chat/completions`
  - `GET /api/v1/chat/sessions`
  - `GET /api/v1/chat/sessions/{session_id}`

### 5.3 系统配置模块

- **输入**：Provider 配置、模型参数
- **处理**：配置校验与持久化，运行时注入问答链路
- **输出**：当前生效配置
- **接口**：
  - `GET /api/v1/system/providers`
  - `GET /api/v1/system/config`
  - `PUT /api/v1/system/config`

## 6. 前端架构（React）

### 页面划分

- `/documents`：文档管理
- `/chat`：Agent 问答
- `/settings`：系统配置

### 目录建议

```text
src/
  app/                 # 路由与应用壳
  pages/               # 页面
  features/
    documents/         # 文档业务组件/状态
    chat/              # 会话与消息组件/状态
    settings/          # 配置表单与状态
  components/ui/       # shadcn/ui 组件
  lib/
    api/               # 请求封装
    query/             # TanStack Query 客户端
    store/             # Zustand store
```

### 状态与请求

- `TanStack Query`：文档列表、会话历史、配置读取等服务端状态
- `Zustand`：当前会话、输入草稿、UI 偏好等本地状态

## 7. 后端架构（FastAPI + LangChain）

### 分层建议

```text
backend/
  app/
    api/               # FastAPI routers
    schemas/           # Pydantic 请求/响应模型
    services/          # 业务服务（文档/问答/配置）
    providers/         # LLM Provider 适配器
    repositories/      # 数据访问层
    core/              # 配置、日志、异常处理
```

### Provider 适配抽象

- `ProviderAdapter` 统一接口：
  - `chat(messages, config) -> answer`
  - `embed(texts, config) -> vectors`
- 具体实现：
  - `OpenAIAdapter`
  - `ClaudeAdapter`
  - `LocalModelAdapter`

## 8. 数据与存储（最小可行）

- 文档元数据：`SQLite`（开发）/ `PostgreSQL`（生产）
- 向量检索：可选 `FAISS`（本地）或 `Chroma`
- 会话记录：`SQLite/PostgreSQL`

> 说明：开发阶段可全本地（SQLite + FAISS），部署阶段可替换为 PostgreSQL + 托管向量库。

## 9. API 分组（OpenAPI）

- `Documents API`：文档上传、查询、删除
- `Chat API`：问答与会话
- `System API`：Provider 与配置

OpenAPI 文档建议：

- `GET /openapi.json`
- `GET /docs`（Swagger UI）

## 10. 部署运行（Docker）

### 10.1 容器组成

- `frontend`：React + Vite 构建后由 Nginx 提供静态服务
- `backend`：FastAPI 服务

### 10.2 环境变量（示例）

- `APP_ENV=dev`
- `OPENAI_API_KEY=...`
- `ANTHROPIC_API_KEY=...`
- `DEFAULT_PROVIDER=openai`
- `VECTOR_STORE=faiss`

### 10.3 启动方式（示例）

```bash
docker compose up --build
```

启动后访问：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8000`
- 后端文档：`http://127.0.0.1:8000/api/v1/docs`

## 11. 测试说明（最小可行）

- 前端单测：组件渲染、页面交互、请求状态
- 后端单测：文档服务、问答服务、配置服务
- 后端集成测试：文档上传 -> 索引 -> 提问 -> 返回答案

## 12. 扩展方向（加分项）

- 增加 `PDF`、`Word` 解析能力（统一接入文档解析管道）
- 增加检索策略（混合检索、重排）
- 增加多租户与权限控制（如后续需要）

---

如果你需要，我可以下一步基于这份 README 再补一个“最小可运行目录骨架（前后端项目结构 + 接口占位）”。
