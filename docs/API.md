# 智能文档问答助手 — 接口文档

本文档描述后端 REST API 的请求与响应约定。所有接口统一前缀：`/api/v1`。默认请求/响应格式：`application/json`；文件上传为 `multipart/form-data`。

- 基地址示例：`http://localhost:8000`
- 在线文档：运行后端后访问 `GET /api/v1/docs`（Swagger）、`GET /api/v1/redoc`（ReDoc）、`GET /api/v1/openapi.json`

---

## 1. Health API（健康检查）

### 1.1 健康检查

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/health` |
| 响应 | 200，JSON |

响应体示例：

```json
{
  "ok": true,
  "app": "Doc QA Backend",
  "version": "0.1.0"
}
```

---

## 2. Documents API（文档管理）

### 2.1 获取文档列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/documents` |
| 响应 | 200，文档数组 |

响应体为 `DocumentItem[]`，单条结构：

```json
{
  "id": "string",
  "name": "note.md",
  "title": "note.md",
  "plainText": "# Title\n\nBody",
  "type": "markdown",
  "status": "ready",
  "updatedAt": "2026-03-07T10:00:00+00:00",
  "sourceFormat": null
}
```

- `type`：存储内容的格式，`txt` | `markdown`（MinerU 解析的 PDF/Word 等入库后均为 `markdown`）
- `sourceFormat`：可选。原始上传文件格式（如 `pdf`、`docx`），仅 MinerU 解析的文档有值；前端展示文档类型时优先使用本字段，无则用 `type`
- `status`：如 `ready`

### 2.2 直接提交文本创建文档

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/documents` |
| 请求体 | JSON |
| 响应 | 201，新建的 DocumentItem；同名返回 409；内容为空返回 400 |

请求体：

```json
{
  "title": "文档标题",
  "plainText": "用户直接输入的文本内容",
  "type": "txt"
}
```

- `title` 可选，默认 `untitled`
- `type`：`txt` | `markdown`

### 2.3 上传文件

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/documents/upload` |
| 请求体 | `multipart/form-data`，字段名 `files`（多文件） |
| 响应 | 200，新建成功的 `DocumentItem[]` |

支持格式：

- **直接解析**（无需额外配置）：`.txt`、`.md`、`.markdown`；MIME `text/plain`、`text/markdown`
- **MinerU 解析**（需配置 MinerU Token）：`.pdf`、`.doc`、`.docx`、`.ppt`、`.pptx`、`.png`、`.jpg`、`.jpeg`、`.html`

处理规则：去除 UTF-8 BOM、统一换行为 LF、去除首尾空白；按文件名去重，重复文件名会被忽略。未配置 MinerU 而上传仅 MinerU 支持的格式时返回 503。

### 2.4 批量删除文档

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/documents` |
| 请求体 | JSON |
| 响应 | 204 No Content |

请求体：

```json
{
  "ids": ["doc-1", "doc-2"]
}
```

---

## 3. Chat API（问答）

### 3.1 发送消息（非流式）

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/chat/completions` |
| 请求体 | JSON |
| 响应 | 200，JSON |

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
      "updatedAt": "string",
      "sourceFormat": null
    }
  ],
  "sessionId": "optional",
  "modelConfigId": "optional"
}
```

- `documents`：当前对话使用的文档列表，用于检索与上下文
- `sessionId`：可选，不传则新建会话
- `modelConfigId`：可选，指定使用的模型配置；不传则使用默认配置

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

- `references`：引用的文档名称列表
- `provider` / `modelName`：实际使用的模型信息

### 3.2 发送消息（流式 SSE）

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/chat/completions/stream` |
| 请求体 | 与 3.1 相同 |
| 响应 | 200，`Content-Type: text/event-stream`，Server-Sent Events |

事件格式：

- **内容块**：`data: {"content": "<delta>"}\n\n`（增量文本，可多次）
- **结束块**：`data: {"done": true, "sessionId": "...", "createdAt": "...", "references": [...], "modelConfigId": "...", "provider": "...", "modelName": "..."}\n\n`
- **错误**：`data: {"error": "<message>"}\n\n`

若请求本身失败（4xx/5xx），响应为非流式 JSON，与普通错误一致。

---

## 4. Chat Sessions API（会话）

### 4.1 获取会话列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/chat/sessions` |
| 响应 | 200，会话数组 |

响应体为 `ChatSessionItem[]`，单条示例：

```json
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
```

### 4.2 全量持久化会话

| 项目 | 说明 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/api/v1/chat/sessions` |
| 请求体 | `ChatSessionItem[]`（全量会话列表） |
| 响应 | 200 |

后端按全量覆盖方式持久化会话，包含 `messages`、`loadedDocuments`、`pendingDocuments`、当前模型配置等。聊天接口产生的新会话也会写入，供 GET 拉取。

---

## 5. System API（系统配置）

### 5.1 获取 Provider 列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/system/providers` |
| 响应 | 200，JSON |

响应体：

```json
{
  "items": ["openai", "claude", "local", "community"]
}
```

### 5.2 获取模型配置列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/system/llm-configs` |
| 响应 | 200，JSON |

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

- `hasApiKey`：是否已保存密钥（不返回明文）
- `apiBase`：local/community 时使用

### 5.3 创建模型配置

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/system/llm-configs` |
| 请求体 | JSON |
| 响应 | 201，新建的 LLMConfigItem（不含明文 apiKey） |

请求体示例：

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

- `openai`、`claude`：需提供 `apiKey`
- `local`、`community`：需提供 `apiBase`

### 5.4 更新模型配置

| 项目 | 说明 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/api/v1/system/llm-configs/{config_id}` |
| 请求体 | JSON（可部分字段） |
| 响应 | 200，更新后的 LLMConfigItem |

不传 `apiKey` 时沿用已存储值；传 `isDefault: true` 时，其他配置的默认标记会被清除。

### 5.5 删除模型配置

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/system/llm-configs/{config_id}` |
| 响应 | 204 No Content |

### 5.6 测试模型连通性

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/system/llm-configs/test` |
| 请求体 | JSON |
| 响应 | 200，JSON（不抛异常，通过 `ok` 表示成功与否） |

请求体示例（OpenAI/Claude）：

```json
{
  "provider": "openai",
  "apiKey": "sk-***",
  "modelName": "gpt-4o-mini"
}
```

local/community 需传 `apiBase`。响应示例：

```json
{
  "ok": true,
  "detail": "Successfully connected to provider 'openai' with model 'gpt-4o-mini'."
}
```

失败时 `ok` 为 `false`，`detail` 为可读原因；参数校验失败返回 400。

### 5.7 MinerU Token（可选）

| 项目 | 说明 |
|------|------|
| 方法 | `GET` / `PUT` |
| 路径 | `/api/v1/system/mineru-token` |

- **GET**：响应 `{ "hasToken": true }` 或 `{ "hasToken": false }`（不返回明文）
- **PUT**：请求体 `{ "token": "string | null" }`，传 `null` 或空字符串表示清除；用于 PDF/Word 等格式解析

---

## 6. 错误与状态码

- `200`：成功（含 JSON 业务错误如连通性测试失败）
- `201`：创建成功
- `204`：删除成功无内容
- `400`：请求参数错误
- `404`：资源不存在（如 config_id）
- `409`：冲突（如文档同名）
- `503`：依赖不可用（如未配置 MinerU 却上传仅 MinerU 支持的格式）

错误响应体通常为 JSON，包含 `detail` 或业务约定字段。流式接口在流内通过 `{"error": "..."}` 传递错误信息。
