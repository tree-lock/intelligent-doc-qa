# 前端 API 契约与需求文档

本文档由两部分组成：

- **第一部分（§1–§8）**：**前端 API 契约对齐文档**。描述当前仓库已实现并验证的 P0 后端契约，供前后端联调与接口校对使用。
- **第二部分（§1 概述起）**：**前端 API 需求文档**。由前端代码分析得出的 API 规格与调用来源；当前后端已与第一部分契约对齐，第二部分中“与当前后端差异”等描述已收敛为“已对齐”，详见第一部分与 backend README。

## 1. 范围

本次已落地的范围：

- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `POST /api/v1/documents/upload`
- `DELETE /api/v1/documents`
- `POST /api/v1/chat/completions`
- `POST /api/v1/chat/completions/stream`（流式）
- `GET /api/v1/chat/sessions`
- `PUT /api/v1/chat/sessions`
- `GET /api/v1/system/providers`
- `GET /api/v1/system/llm-configs`
- `POST /api/v1/system/llm-configs`
- `PUT /api/v1/system/llm-configs/{config_id}`
- `DELETE /api/v1/system/llm-configs/{config_id}`
- `GET /api/v1/system/mineru-token`、`PUT /api/v1/system/mineru-token`
- `GET /api/v1/health`

## 2. 基础约定

- API 基地址：`http://localhost:8000`
- 统一前缀：`/api/v1`
- 默认响应格式：`application/json`
- 文件上传：`multipart/form-data`
- 文档只保存规范化后的纯文本，不保存原始文件

## 3. Documents API

### 3.1 获取文档列表

- 方法：`GET`
- 路径：`/api/v1/documents`

响应结构：

```json
[
  {
    "id": "string",
    "name": "note.md",
    "title": "note.md",
    "plainText": "# Title\n\nBody",
    "type": "markdown",
    "status": "ready",
    "updatedAt": "2026-03-07T10:00:00+00:00"
  }
]
```

### 3.2 直接提交文字

- 方法：`POST`
- 路径：`/api/v1/documents`
- 请求体：`application/json`

```json
{
  "title": "文档标题",
  "plainText": "用户直接输入的文本内容",
  "type": "txt"
}
```

说明：

- `title` 可选，默认 `untitled`
- `type` 支持 `txt`、`markdown`
- 规范化后为空会返回 `400`
- 同名文档会返回 `409`

### 3.3 上传文件

- 方法：`POST`
- 路径：`/api/v1/documents/upload`
- 请求体：`multipart/form-data`
- 字段名：`files`

支持类型：

- **直接解析**（无需额外配置）：`.txt`、`.md`、`.markdown`；MIME `text/plain`、`text/markdown`
- **MinerU 解析**（需配置 `MINERU_API_TOKEN`）：`.pdf`、`.doc`、`.docx`、`.ppt`、`.pptx`、`.png`、`.jpg`、`.jpeg`、`.html`

处理规则：

1. 去除 UTF-8 BOM
2. 统一 `CRLF/CR` 为 `LF`
3. 去除首尾空白
4. 按文件名去重；重复文件名直接忽略

响应为新建成功的 `DocumentItem[]`。

### 3.4 批量删除

- 方法：`DELETE`
- 路径：`/api/v1/documents`
- 请求体：

```json
{
  "ids": ["doc-1", "doc-2"]
}
```

- 响应：`204 No Content`

## 4. Chat API

### 4.1 发送消息

- 方法：`POST`
- 路径：`/api/v1/chat/completions`

请求体：

```json
{
  "message": "用户输入的提问内容",
  "documents": [
    {
      "id": "string",
      "name": "string",
      "title": "string",
      "plainText": "string",
      "type": "txt",
      "status": "ready",
      "updatedAt": "string"
    }
  ],
  "sessionId": "optional",
  "modelConfigId": "optional"
}
```

响应体：

```json
{
  "content": "根据已选文档生成的回答",
  "sessionId": "string",
  "createdAt": "2026-03-07T10:00:00+00:00",
  "references": ["sample.txt"],
  "modelConfigId": "cfg-123",
  "provider": "openai",
  "modelName": "gpt-4o-mini"
}
```

说明：

- `documents` 是后端检索上下文的唯一契约来源
- `sessionId` 可选；首轮不传时后端会生成
- 后端会持久化 `chat_sessions` 和 `chat_messages`
- 若存在 `modelConfigId` 或默认模型配置，后端会按配置真实调用对应 provider
- 若没有任何可用模型配置，后端会回退到本地最小可解释 RAG

### 4.2 流式发送消息（SSE）

- 方法：`POST`
- 路径：`/api/v1/chat/completions/stream`
- 请求体：与 4.1 相同（`message`、`documents`、可选 `sessionId`、`modelConfigId`）
- 响应：`Content-Type: text/event-stream`，Server-Sent Events

事件格式：

- **内容块**：`data: {"content": "<delta>"}\n\n`（增量文本，可多次）
- **结束块**：`data: {"done": true, "sessionId": "...", "createdAt": "...", "references": [...], "modelConfigId": "...", "provider": "...", "modelName": "..."}\n\n`
- **错误**：流中可能发送 `data: {"error": "<message>"}\n\n`；客户端应解析并提示用户

说明：

- 前端 Agent 问答页使用本流式接口实现逐字输出；流结束后通过结束块中的元数据合并会话，无需二次请求。
- 若请求失败（如 4xx/5xx），响应为非流式 JSON，与普通接口一致。

## 5. Chat Sessions API

### 5.1 获取会话列表

- 方法：`GET`
- 路径：`/api/v1/chat/sessions`

响应结构：

```json
[
  {
    "id": "chat-1",
    "title": "第一轮对话",
    "messages": [
      { "id": "m-1", "role": "user", "content": "你好" },
      { "id": "m-2", "role": "assistant", "content": "你好，有什么可以帮你？" }
    ],
    "loadedDocuments": [],
    "pendingDocuments": [],
    "currentModelConfigId": "cfg-1",
    "currentProvider": "openai",
    "currentModelName": "gpt-4o-mini",
    "createdAt": "2026-03-07T10:00:00+00:00",
    "updatedAt": "2026-03-07T10:05:00+00:00"
  }
]
```

### 5.2 全量持久化会话

- 方法：`PUT`
- 路径：`/api/v1/chat/sessions`
- 请求体：`ChatSession[]`

说明：

- 按前端当前使用方式，后端采用全量覆盖持久化
- 会同时保存 `messages`、`loadedDocuments`、`pendingDocuments`
- 聊天接口新产生的会话，也会同步写入可供 `GET /chat/sessions` 读取的快照

## 6. System API

### 5.1 获取 Provider 列表

- 方法：`GET`
- 路径：`/api/v1/system/providers`

响应体：

```json
{
  "items": ["openai", "claude", "local", "community"]
}
```

### 5.2 获取模型配置列表

- 方法：`GET`
- 路径：`/api/v1/system/llm-configs`

响应体：

```json
{
  "items": [
    {
      "id": "cfg-1",
      "name": "OpenAI 主模型",
      "provider": "openai",
      "apiBase": "",
      "modelName": "gpt-4o-mini",
      "temperature": 0.7,
      "topP": 0.9,
      "maxTokens": 2000,
      "isDefault": true,
      "hasApiKey": true,
      "createdAt": "2026-03-07T10:00:00+00:00",
      "updatedAt": "2026-03-07T10:00:00+00:00"
    }
  ]
}
```

### 5.3 创建模型配置

- 方法：`POST`
- 路径：`/api/v1/system/llm-configs`

请求体：

```json
{
  "name": "Claude 生产配置",
  "provider": "claude",
  "apiKey": "sk-ant-***",
  "apiBase": "",
  "modelName": "claude-3-5-haiku-latest",
  "temperature": 0.5,
  "topP": 0.8,
  "maxTokens": 1800,
  "isDefault": false
}
```

说明：

- `openai`、`claude` 必须提供 `apiKey`
- `local`、`community` 必须提供 `apiBase`
- 返回体为创建后的 `LLMConfigItem`，不会回传明文 `apiKey`

### 5.4 更新模型配置

- 方法：`PUT`
- 路径：`/api/v1/system/llm-configs/{config_id}`（路径参数为配置 ID）

说明：

- 支持部分更新
- 已保存密钥时，前端可不传 `apiKey`，后端会沿用旧值
- 若请求设置 `isDefault=true`，后端会清除其他配置的默认标记

### 5.5 删除模型配置

- 方法：`DELETE`
- 路径：`/api/v1/system/llm-configs/{config_id}`
- 响应：`204 No Content`

### 5.6 MinerU Token（可选）

- 方法：`GET` / `PUT`
- 路径：`/api/v1/system/mineru-token`
- 用途：查询或设置 MinerU API Token，用于 PDF、Word、PPT、图片、HTML 等格式的文档解析（上传时若配置了 Token 则走 MinerU 解析）。
- GET 响应示例：`{ "hasToken": true }` 或 `{ "hasToken": false }`（不返回明文 Token）。
- PUT 请求体：`{ "token": "string | null" }`，传 `null` 或空字符串表示清除。

## 7. Health API

- 方法：`GET`
- 路径：`/api/v1/health`

响应体：

```json
{
  "ok": true,
  "app": "Doc QA Backend",
  "version": "0.1.0"
}
```

## 8. 已验证结果

已通过的验证：

- 文档列表、文本直传、文件上传、批量删除的契约已实现
- 聊天接口已对齐 `message/documents[/sessionId/modelConfigId] -> content`
- `chat/sessions` 已支持完整会话读取与全量持久化
- `system/providers` 与 `system/llm-configs` CRUD 已实现
- 单测覆盖配置加载、文本规范化、上传去重、聊天契约、会话持久化、系统配置 CRUD
- 本地运行时已实际验证 `health -> system -> chat -> chat/sessions` 链路

待后续阶段继续扩展：

- 更强的检索/生成能力与更多文档格式

_文档版本：2.0 | 状态：P0 已实现并校验_
# 前端 API 需求文档

> 本文档由前端代码分析得出，描述前端为对接后端所需的全套 API 规格。供后端团队实现或校对接口时参考。

## 1. 概述

### 1.1 前端 API 调用来源

| 模块     | 调用位置                   | 用途                     |
| -------- | -------------------------- | ------------------------ |
| 文档管理 | `lib/api/documents.ts`     | 文档查询、上传、删除     |
| 问答     | `lib/api/chat.ts`          | 发送消息、获取 AI 回复   |
| 会话     | `lib/api/chat-sessions.ts` | 会话列表查询、会话持久化 |

### 1.2 环境与基础约定

- **API 基地址**：通过 `VITE_API_BASE_URL` 配置，默认 `http://localhost:8000`
- **接口前缀**：`/api/v1`
- **请求格式**：`application/json`（除文件上传为 `multipart/form-data`）
- **响应格式**：`application/json`

---

## 2. Documents API（文档管理）

### 2.0 存储策略

- **仅存储文字**：后端不保存原始文件，只将内容以纯文本形式存入数据库。
- **文档上传**：若前端上传的是文件（TXT、Markdown），后端需先读取并解析为文字，再写入数据库。
- **直接提交文字**：前端也可直接提交文本内容，后端直接入库，无需解析。

---

### 2.1 获取文档列表

**前端调用**：`fetchDocuments()`（`useDocumentsQuery`）

| 项目 | 说明                |
| ---- | ------------------- |
| 方法 | `GET`               |
| 路径 | `/api/v1/documents` |
| 响应 | 文档数组            |

**前端期望的文档结构**（`DocumentItem`）：

```json
{
  "id": "string",
  "name": "string",
  "title": "string",
  "plainText": "string",
  "type": "txt | markdown",
  "status": "ready | indexing | failed",
  "updatedAt": "string"
}
```

| 字段      | 类型   | 说明                                             |
| --------- | ------ | ------------------------------------------------ |
| id        | string | 文档唯一标识                                     |
| name      | string | 文件名（如 `example.txt`）                       |
| title     | string | 展示标题，通常与 name 相同                       |
| plainText | string | 解析后的纯文本内容                               |
| type      | enum   | `txt` 或 `markdown`                              |
| status    | enum   | `ready` / `indexing` / `failed`                  |
| updatedAt | string | 更新时间，建议 `YYYY-MM-DD HH:mm:ss` 或 ISO 8601 |

---

### 2.2 创建文档（上传文档或直接提交文字）

前端支持两种创建文档的方式，后端需统一处理：**无论哪种方式，最终只将解析后的纯文本存入数据库，不存储原始文件**。

#### 方式一：上传文档

**前端调用**：`uploadDocuments(files: File[])`（`useDocumentUpload`）

| 项目   | 说明                                                        |
| ------ | ----------------------------------------------------------- |
| 方法   | `POST`                                                      |
| 路径   | `/api/v1/documents/upload` 或 `/api/v1/documents`（多文件） |
| 请求体 | `multipart/form-data`，字段名 `files`，支持多个文件         |
| 响应   | 新创建的文档数组                                            |

**后端处理流程**：

1. 接收上传的文件（TXT / Markdown）
2. **将文件内容读取为纯文本**（去除 BOM、统一换行符、去除首尾空白）
3. **仅将解析后的文本存入数据库**，不存储原始文件
4. 返回完整 `DocumentItem`（含 `plainText`、`status`、`type` 等）

**支持的文档类型**：

- 扩展名：`.txt`、`.md`、`.markdown`
- MIME：`text/plain`、`text/markdown`

**业务规则（前端当前实现）**：

- 按文件名去重，已存在同名校验后忽略
- 响应需包含完整 `DocumentItem`（含 `plainText`、`status`、`type` 等）

#### 方式二：直接提交文字

| 项目   | 说明                                                                   |
| ------ | ---------------------------------------------------------------------- |
| 方法   | `POST`                                                                 |
| 路径   | `/api/v1/documents`（与上传共用或单独路径如 `/api/v1/documents/text`） |
| 请求体 | `application/json`，见下方                                             |
| 响应   | 新创建的文档对象或数组                                                 |

**请求体结构**（直接提交文字时）：

```json
{
  "title": "文档标题（可选，缺省时可用时间戳等）",
  "plainText": "用户直接输入的文本内容",
  "type": "txt"
}
```

| 字段      | 类型   | 必填 | 说明                            |
| --------- | ------ | ---- | ------------------------------- |
| title     | string | 否   | 展示标题，缺省时可自动生成      |
| plainText | string | 是   | 纯文本内容                      |
| type      | enum   | 否   | `txt` 或 `markdown`，默认 `txt` |

**后端处理**：直接将 `plainText` 存入数据库，无需文件解析。

**当前后端**：已对齐。后端支持 `POST /documents` 直接提交文字（JSON）与 `POST /documents/upload` 多文件上传，返回完整 `DocumentItem`。详见本文档第一部分 §3。

---

### 2.3 删除文档

**前端调用**：`deleteDocuments(ids: string[])`（`useDocumentUpload`）

| 项目   | 说明                                       |
| ------ | ------------------------------------------ |
| 方法   | `DELETE`                                   |
| 路径   | `/api/v1/documents`                        |
| 请求体 | `{ "ids": ["id1", "id2", ...] }`           |
| 响应   | `204 No Content` 或 `{ "message": "..." }` |

**当前后端**：已对齐。后端支持 `DELETE /documents`，请求体 `{ "ids": [...] }` 批量删除。详见本文档第一部分 §3.4。

---

## 3. Chat API（问答）

### 3.1 发送消息并获取回复

**前端调用**：`sendChatMessage(payload)`（`useSendChatMessageMutation`）

| 项目   | 说明                       |
| ------ | -------------------------- |
| 方法   | `POST`                     |
| 路径   | `/api/v1/chat/completions` |
| 请求体 | 见下方                     |

**请求体结构**（`SendChatMessagePayload`）：

```json
{
  "message": "用户输入的提问内容",
  "documents": [
    {
      "id": "string",
      "name": "string",
      "title": "string",
      "plainText": "string",
      "type": "txt",
      "status": "ready",
      "updatedAt": "string"
    }
  ]
}
```

| 字段      | 类型           | 说明                                |
| --------- | -------------- | ----------------------------------- |
| message   | string         | 用户问题                            |
| documents | DocumentItem[] | 当前会话关联的文档，用于 RAG 上下文 |

**响应结构**（`SendChatMessageResult`）：

```json
{
  "content": "AI 生成的回复文本"
}
```

**当前后端**：已对齐。后端接收 `message`、`documents`、可选 `sessionId`、`modelConfigId`，响应 `content`、`sessionId`、`createdAt`、`references` 等；并支持流式 `POST /api/v1/chat/completions/stream`。详见本文档第一部分 §4。

---

### 3.2 多轮对话

前端当前实现：

- 会话与消息历史由前端在本地维护（`ChatSession`）
- 每次发送消息时，会带上用户当前勾选的 `documents`
- 多轮上下文可由两种方式实现：
  1. **方案 A**：前端每次请求携带 `message` + `documents`，后端不存储会话，仅基于本次请求上下文回复
  2. **方案 B**：前端传入 `session_id`（或新建会话时由后端返回），后端维护会话历史并在回复时使用历史上下文

若采用方案 B，建议约定：

- 请求体增加可选字段 `session_id`
- 响应体增加 `session_id`，供前端后续请求复用

---

## 4. Chat Sessions API（会话管理）

### 4.1 获取会话列表

**前端调用**：`fetchChatSessions()`（`useChatSessions`）

| 项目 | 说明                    |
| ---- | ----------------------- |
| 方法 | `GET`                   |
| 路径 | `/api/v1/chat/sessions` |
| 响应 | 会话数组                |

**前端期望的会话结构**（`ChatSession`）：

```json
{
  "id": "string",
  "title": "string",
  "messages": [
    { "id": "string", "role": "user | assistant", "content": "string" }
  ],
  "loadedDocuments": [
    /* DocumentItem[] */
  ],
  "pendingDocuments": [
    /* DocumentItem[] */
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
```

**当前实现状态**：

- 后端已返回完整 `ChatSession` 结构
- 响应包含 `messages`、`loadedDocuments`、`pendingDocuments`、`currentModelConfigId`
- 聊天接口写入的会话也能通过本接口读回

**说明**：当前前端已可将 `fetchChatSessions`/`persistChatSessions` 对接到后端；后端持久化策略为全量覆盖同步。

---

### 4.2 持久化会话

**前端调用**：`persistChatSessions(sessions: ChatSession[])`（`useChatSessions`）

| 项目   | 说明                        |
| ------ | --------------------------- |
| 方法   | `PUT` 或 `POST`             |
| 路径   | `/api/v1/chat/sessions`     |
| 请求体 | 会话数组（与 4.1 结构一致） |
| 响应   | 持久化后的会话数组（可选）  |

**说明**：当前后端实现为全量更新，适配前端现有 `setSessions -> persistChatSessions` 调用方式。

---

## 5. System API（系统配置）

当前系统配置已改为“多模型配置 + 后端统一选模调用”

### 5.1 获取 Provider 列表

| 项目 | 说明                                                |
| ---- | --------------------------------------------------- |
| 方法 | `GET`                                               |
| 路径 | `/api/v1/system/providers`                          |
| 响应 | `{ "items": ["openai", "anthropic", "community"] }` |

### 5.2 获取模型配置列表

| 项目 | 说明                         |
| ---- | ---------------------------- |
| 方法 | `GET`                        |
| 路径 | `/api/v1/system/llm-configs` |
| 响应 | `LLMConfigItem[]`            |

```json
{
  "items": [
    {
      "id": "cfg-1",
      "name": "OpenAI 主模型",
      "provider": "openai",
      "apiBase": "",
      "modelName": "gpt-4o-mini",
      "temperature": 0.7,
      "topP": 0.9,
      "maxTokens": 2000,
      "isDefault": true,
      "hasApiKey": true,
      "createdAt": "2026-03-07T10:00:00.000Z",
      "updatedAt": "2026-03-07T10:00:00.000Z"
    }
  ]
}
```

### 5.3 创建模型配置

| 项目   | 说明                         |
| ------ | ---------------------------- |
| 方法   | `POST`                       |
| 路径   | `/api/v1/system/llm-configs` |
| 请求体 | `LLMConfigCreate`            |
| 响应   | 创建后的 `LLMConfigItem`     |

```json
{
  "name": "Claude 生产配置",
  "provider": "claude",
  "apiKey": "sk-ant-***",
  "apiBase": "",
  "modelName": "claude-3-5-haiku-latest",
  "temperature": 0.5,
  "topP": 0.8,
  "maxTokens": 1800,
  "isDefault": false
}
```

### 5.4 更新模型配置

| 项目   | 说明                              |
| ------ | --------------------------------- |
| 方法   | `PUT`                             |
| 路径   | `/api/v1/system/llm-configs/{config_id}` |
| 请求体 | `LLMConfigUpdate`，支持部分更新   |
| 响应   | 更新后的 `LLMConfigItem`          |

说明：

- 已保存密钥时，前端可不回传 `apiKey`，后端会沿用旧值。
- `local`、`community` provider 必须填写 `apiBase`。
- `openai`、`claude` provider 必须有 API Key。

### 5.5 删除模型配置

| 项目 | 说明                              |
| ---- | --------------------------------- |
| 方法 | `DELETE`                          |
| 路径 | `/api/v1/system/llm-configs/{config_id}` |
| 响应 | `204 No Content`                  |

### 5.6 模型配置连通性测试

| 项目   | 说明                                       |
| ------ | ------------------------------------------ |
| 方法   | `POST`                                     |
| 路径   | `/api/v1/system/llm-configs/test`          |
| 请求体 | `provider`、`modelName` 必填；`apiKey`、`apiBase`、`configId` 可选 |
| 响应   | `{ "ok": boolean, "detail": string \| null }` |

说明：

- 用于检测当前配置（provider、modelName、apiBase、apiKey）能否连通对应模型，不写入数据库。
- **configId（可选）**：当请求中未传或未填写 `apiKey` 时，若传入已存配置的 `configId`，后端将使用该配置中已保存的 API Key 执行本次连通性测试（密钥不返回前端）。适用于前端编辑已有配置时，用户未重新输入密钥即可点击「测试连通性」的场景。
- 若传入了无效的 `configId`（配置不存在），后端返回 `404`。

### 5.7 MinerU Token（可选）

| 项目 | 说明 |
| ---- | ---- |
| 方法 | `GET` / `PUT` |
| 路径 | `/api/v1/system/mineru-token` |
| 用途 | 查询或设置 MinerU API Token，用于 PDF、Word、PPT、图片、HTML 等格式上传解析。GET 返回 `{ "hasToken": boolean }`；PUT 请求体 `{ "token": string \| null }`。 |

---

## 6. 对接差异汇总

当前后端已与前端契约对齐，各 API 行为以本文档**第一部分（契约对齐文档）**及 `backend/README.md` 为准：

- **文档**：GET 列表、POST 直接文本、POST upload 多文件、DELETE 批量 `ids`，响应完整 `DocumentItem`。
- **聊天**：POST completions / completions/stream，请求 `message` + `documents` + 可选 `sessionId`/`modelConfigId`，响应 `content`、`sessionId`、`references` 等；会话由 GET/PUT `/chat/sessions` 全量读写。
- **系统配置**：providers、llm-configs CRUD、llm-configs/test、mineru-token GET/PUT 已实现。

---

## 7. 类型定义参考（TypeScript）

```typescript
// frontend/src/types/index.ts
export type DocumentItem = {
  id: string;
  name: string;
  title: string;
  plainText: string;
  type: "txt" | "markdown";
  status: "ready" | "indexing" | "failed";
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// frontend/src/lib/chat-sessions.ts
export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  loadedDocuments: DocumentItem[];
  pendingDocuments: DocumentItem[];
  currentModelConfigId?: string;
  currentProvider: string;
  currentModelName: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 8. 实现优先级建议

1. **P0（主链路）**

   - 文档：`GET /documents`、`POST /documents`（上传文档时读成文字后入库，或直接提交文字；仅存文本不存文件）
   - 聊天：`POST /chat/completions`（接收 `message` + `documents`，返回 `content`）

2. **P1（体验完善）**

   - 文档：批量删除 `DELETE /documents`（body: `{ ids }`）
   - 文档：多文件上传或前端循环调用；支持直接提交文字的 `POST /documents`（JSON）

3. **P2（可选）**
   - 会话：继续扩展增量同步、冲突处理与服务端分页/过滤能力
   - 系统配置：继续扩展模型连通性检测、密钥脱敏展示、默认模型管理体验

---

_文档版本：1.1 | 生成自 frontend 代码分析 | 对应项目：智能文档问答助手_
