# Frontend README

## 1. 项目定位

`frontend` 是智能文档问答助手的前端应用，负责：

- 文档管理页面（上传、列表、详情、删除）
- Agent 问答页面（会话列表、消息区、输入区）
- 系统配置页面（Provider、默认模型/参数）

前端通过 HTTP API 调用 `backend` 服务，承载页面交互、状态管理和请求缓存。

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

默认启动后可通过 Vite 输出的本地地址访问页面。

### 3.3 常用脚本

```bash
bun run dev           # 本地开发
bun run build         # 生产构建
bun run test          # 单元测试
bun run preview       # 预览构建产物
bun run format        # 使用 Biome 自动格式化
bun run format:check  # 检查格式
```

## 3.4 Docker 运行

在仓库根目录执行：

```bash
docker compose up --build frontend
```

页面地址：

- Web: `http://127.0.0.1:5173`

## 4. 与后端联调

- 后端默认接口前缀：`/api/v1`
- 建议本地先启动 `backend`（默认端口 `8000`）
- 前端可通过统一 API 封装层对接：
  - `Documents API`
  - `Chat API`
  - `System API`

建议使用环境变量管理 API 基地址（如 `VITE_API_BASE_URL`），避免在业务代码中硬编码地址。

## 5. 目录基线（参考 bulletproof-react）

参考：

- https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md

当前已按该结构建立基础目录骨架（每个目录至少包含一个示例文件）：

```text
src/
  app/
    routes/
  assets/
  components/
  config/
  hooks/
  lib/
  stores/
  testing/
  types/
  utils/
```

说明：

- `example-*` 文件仅用于初始化目录结构，不代表最终业务实现。
- 具体业务模块（如 documents/chat/settings）可在 `features/` 下按同样模式扩展。

## 6. 开发约定

- 服务端状态优先放在 `TanStack Query`
- 会话草稿、UI 偏好等本地状态放在 `Zustand`
- 公共请求逻辑集中在 `src/lib/api`
- 提交前至少执行一次 `bun run format:check`

## 7. 当前 UI 骨架（2026-03）

当前已完成首版三页骨架与统一布局（参考深色学习助手风格）：

- `src/components/layout/app-shell.tsx`
  - 左侧导航（文档管理 / Agent 问答 / 系统配置）
  - 主内容区统一容器与背景层次
- `src/pages/documents-page.tsx`
  - 上传输入区（UI 占位）
  - 文档列表、状态标签、删除操作入口（Mock）
- `src/pages/chat-page.tsx`
  - 会话列表（Mock）
  - 消息展示区（区分用户与助手）与输入框（UI 占位）
- `src/pages/settings-page.tsx`
  - 模型来源切换（系统内置 MiniMax / 自定义模型）
  - 自定义模型字段（Provider / Model Name / API Key）
  - 模型参数表单（maxTokens / temperature / topP）
  - 保存与重置按钮（本地持久化）
### 7.1 系统配置页模型配置说明

- 内置模型：
  - 目前内置 `MiniMax`，可直接选择并保存。
- 自定义模型：
  - 选择“自定义模型”后，需要填写 `Provider`、`Model Name`、`API Key`。
  - 示例：`Provider=Qwen`、`Model Name=Qwen3.5-plus`。
- 保存策略：
  - 当前阶段使用浏览器 `localStorage` 持久化（键名：`doc-qa.system-settings.v1`）。
  - 页面刷新后会自动加载已保存配置。
  - 该策略可在后续替换为 `System API` 持久化，不影响页面表单结构。

后续接入建议：

1. 在 `src/lib/api` 增加 Documents / Chat / System API 封装
2. 页面层使用 TanStack Query 请求后端 API
3. 把本地 UI 状态（例如草稿、当前会话）迁移到 `Zustand`
