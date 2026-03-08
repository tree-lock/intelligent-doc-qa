# Frontend README

## 1. 项目定位

`frontend` 是智能文档问答助手的前端应用，负责：

- 文档管理页面（上传、列表、多选、删除）
- Agent 问答页面（会话列表、消息区、输入区）
- 系统配置页面（Provider、默认模型/参数）

前端承载页面交互、状态管理和请求缓存。已通过 `lib/api` 对接后端 HTTP API（文档、会话、系统配置均走后端接口）。

## 2. 技术栈

- `Bun`
- `React 19` + `TypeScript`
- `Vite`
- `TailwindCSS`
- `React Router`
- `shadcn/ui`（组件体系）
- `Zustand`（本地状态）
- `TanStack Query`（服务端状态与缓存）
- `Biome`（代码格式化）

## 3. 本地开发

### 3.1 安装依赖

推荐使用 Bun（仓库已包含 `bun.lock`）：

```bash
bun install
```

也可使用 npm：

```bash
npm install
```

### 3.2 启动开发服务

```bash
bun run dev
```

默认启动后可通过 Vite 输出的本地地址访问页面。如需指定后端 API 地址，可复制项目根目录下的 `frontend/.env.example` 为 `frontend/.env`，并修改 `VITE_API_BASE_URL`（默认 `http://localhost:8000`）。

### 3.3 常用脚本

```bash
bun run dev           # 本地开发
bun run build         # 生产构建
bun run test          # 单元测试
bun run preview       # 预览构建产物
bun run lint          # 代码检查
bun run lint:fix      # 自动修复 lint 问题
bun run format        # 使用 Biome 自动格式化
bun run format:check  # 检查格式
```

### 3.4 Docker 运行

在仓库根目录执行：

```bash
docker compose up --build frontend
```

页面地址：`http://127.0.0.1:80`

构建时可通过 `VITE_API_BASE_URL` 指定后端 API 地址，例如：

```bash
VITE_API_BASE_URL=http://your-backend:8000 docker compose up --build frontend
```

## 4. 与后端联调

- 后端默认接口前缀：`/api/v1`
- 建议本地先启动 `backend`（默认端口 `8000`）
- 前端可通过统一 API 封装层对接：
  - `Documents API`
  - `Chat API`
  - `System API`

建议使用环境变量管理 API 基地址（如 `VITE_API_BASE_URL`），避免在业务代码中硬编码地址。

## 5. 目录结构

```text
src/
  app/                    # 应用入口与路由
    route-config.ts       # 路由路径配置
    route-context.ts      # 路由上下文（Chat 状态透传）
    router.tsx            # React Router 配置
    provider.tsx          # TanStack Query + 全局 Provider
  pages/                  # 页面组件
    documents-page.tsx    # 文档管理页
    documents-route-page.tsx
    chat-page.tsx         # Agent 问答页
    chat-route-page.tsx
    settings-page.tsx     # 系统配置页
    settings-route-page.tsx
  components/
    layout/               # 布局组件
      app-shell.tsx       # 左侧导航 + 主内容区
    documents/            # 文档管理相关组件
      document-card.tsx   # 文档卡片
      document-upload-zone.tsx  # 上传区域（拖拽 + 点击）
    chat/                 # 问答相关组件
      chat-input.tsx      # 输入框
      message-list.tsx    # 消息列表
      document-sidebar.tsx     # 对话文档侧边栏
      add-document-dialog.tsx  # 添加文档弹窗
    settings/             # 配置相关组件
      model-source-section.tsx
      builtin-model-section.tsx
      custom-model-section.tsx
      parameters-section.tsx
      settings-field.tsx
    ui/                   # 通用 UI 组件（shadcn/ui）
  hooks/                  # 业务 hooks
    use-documents-query.ts
    use-document-upload.ts
    use-chat-sessions.ts
    use-app-chat-state.ts
    use-send-chat-message-mutation.ts
    use-chat-input.ts
    use-document-selection.ts
    use-system-settings.ts
  lib/
    api/                  # API 封装层（已对接后端）
      documents.ts
      chat.ts
      chat-sessions.ts
      system.ts
    documents-storage.ts  # 文档本地存储
    chat-sessions.ts      # 会话模型与本地持久化
    system-settings-storage.ts
    system-settings.ts
  types/                  # 类型定义
```

## 6. 开发约定

- 服务端状态优先放在 `TanStack Query`
- 会话草稿、UI 偏好等本地状态放在 `Zustand`
- 公共请求逻辑集中在 `src/lib/api`
- 提交前执行 `bun run lint:fix` 和 `bun run format`，确保通过 `bun run lint` 检查

## 7. 当前实现（2026-03）

前端三页已完整实现，采用浅色学习助手风格，布局与交互可独立运行。

### 7.1 布局与导航

- **`src/components/layout/app-shell.tsx`**
  - 左侧导航：文档管理、Agent 问答、系统配置
  - 最近会话列表（最多 8 条）
  - 主内容区统一容器与背景

### 7.2 文档管理页 `/`

- **`src/pages/documents-page.tsx`**
  - 文档上传：拖拽或点击上传，支持 TXT / Markdown
  - 文档列表：卡片展示，支持多选、编辑模式
  - 删除：编辑模式下可批量删除
  - 开启新对话：勾选文档后跳转至 Agent 问答页，发送首条消息时加载

### 7.3 Agent 问答页 `/chat`、`/chat/:id`

- **`src/pages/chat-page.tsx`**
  - 会话管理：新会话 `/chat`，历史会话 `/chat/:id`
  - 消息区：区分用户与助手，支持多轮对话
  - 对话文档侧边栏：展示已加载 / 待加载文档，支持通过弹窗添加文档
  - 输入框：支持回车发送、提交中禁用
- **数据层**：会话与消息由后端 Chat API（`POST /api/v1/chat/completions`、`/completions/stream`）与 `GET/PUT /api/v1/chat/sessions` 提供

### 7.4 系统配置页 `/settings`

- **`src/pages/settings-page.tsx`**
  - 自定义模型：Provider、Model Name、API Key
  - 模型参数：maxTokens、temperature、topP
  - MinerU Token（可选，用于 PDF/Word 等格式解析）
  - 保存与重置，由后端 System API 持久化（含模型配置与 MinerU Token）

### 7.5 数据层说明

| 模块       | 当前实现                         | 说明     |
| ---------- | -------------------------------- | -------- |
| 文档管理   | `lib/api/documents.ts`           | 已对接后端 Documents API |
| 会话与消息 | `lib/api/chat.ts`、`chat-sessions.ts` | 已对接后端 Chat API 与 chat/sessions |
| 系统配置   | `lib/api/system.ts`              | 已对接后端 System API（llm-configs、mineru-token） |

通过环境变量 `VITE_API_BASE_URL` 配置后端地址，便于联调切换。
