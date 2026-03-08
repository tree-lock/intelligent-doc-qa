# 服务器部署注意事项

本文档说明将智能文档问答助手部署到生产服务器时需要关注的事项。

## 1. 环境变量与配置

### 1.1 前端 API 地址（必改）

前端在**构建时**会把后端 API 地址写进静态资源，部署到服务器后必须用**用户浏览器可访问到的后端地址**来构建：

- 若用户通过 `https://your-domain.com` 访问前端，后端在 `https://your-domain.com/api` 或同域不同端口，则：
  - **同域反向代理**：可设 `VITE_API_BASE_URL=`（空）或 `VITE_API_BASE_URL=/api`（若通过 Nginx 把 `/api` 反代到后端），然后**重新构建**前端镜像。
  - **后端单独域名/端口**：设 `VITE_API_BASE_URL=https://api.your-domain.com` 或 `https://your-domain.com:8000`，再构建。

构建示例：

```bash
VITE_API_BASE_URL=https://api.your-domain.com docker compose build frontend
```

**注意**：改完 `VITE_API_BASE_URL` 后必须重新 `build` 前端，仅改环境变量不重建镜像不会生效。

### 1.2 后端 CORS（必改）

后端通过 `CORS_ALLOWED_ORIGINS` 控制允许的前端来源。部署后必须把**实际前端访问来源**（含协议、域名、端口）配进去，否则浏览器会报跨域错误。

- 格式为 JSON 数组，例如：`["https://your-domain.com","https://www.your-domain.com"]`
- 若前端与后端同域（通过反向代理同域名），仍建议显式写上该域名。

在 `docker-compose` 同目录创建 `.env`（不要提交到 Git），例如：

```env
CORS_ALLOWED_ORIGINS=["https://your-domain.com"]
VITE_API_BASE_URL=https://api.your-domain.com
```

并在 `docker-compose.yml` 中让 backend 使用该变量（见项目内 `docker-compose.yml` 中的 `environment` 配置）。

### 1.3 密钥与敏感配置（必做）

- **不要**把 `.env` 或含 API Key 的文件提交到 Git。
- 在服务器上单独维护 `.env`，并设置好文件权限（如 `chmod 600 .env`）。
- 若使用 OpenAI、Claude、MinerU 等，在服务器 `.env` 中配置：
  - `OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 等（若后端需要默认密钥）
  - `mineru_api_token`（若使用 MinerU 解析 PDF/Word 等）
- 系统配置页中用户填写的 API Key 会存库，需保证数据库与传输安全（见下文 HTTPS、数据持久化）。

## 2. 数据持久化

- 当前默认使用 **SQLite**，项目内 `docker-compose.yml` 已做如下配置：
  - `DATABASE_URL` 默认为 `sqlite+aiosqlite:///./data/doc_qa.db`（数据库文件在 `/app/data` 下）。
  - 后端 `chroma_persist_path` 默认为 `./data/chroma`，也在 `/app/data` 下。
  - 已配置命名卷 `doc-qa-data` 挂载到 backend 的 `/app/data`，**数据库与向量库都会持久化**，容器重建不会丢数据。
- 若你之前自行部署时使用的是默认 `doc_qa.db` 在 `/app` 根目录，迁移到当前 compose 时需把旧库拷贝到卷内对应路径，或暂时保留 `DATABASE_URL=sqlite+aiosqlite:///./doc_qa.db` 并自行增加对 `/app` 下数据目录的卷挂载。
- 若改用 MySQL/PostgreSQL，在服务器 `.env` 中设置 `DATABASE_URL` 为对应连接串，并做好备份策略。

## 3. HTTPS 与反向代理

- 当前 Docker 仅暴露 HTTP（前端 80、后端 8000）。生产环境**强烈建议**用 Nginx、Caddy 等做反向代理并配置 HTTPS（如 Let’s Encrypt）。
- 做法示例：
  - 前端：`https://your-domain.com` → 反代到本机 `frontend:80` 或直接到静态资源。
  - 后端：`https://your-domain.com/api` → 反代到本机 `backend:8000`，并设置 `X-Forwarded-Proto`、`X-Forwarded-Host` 等，以便后端需要时识别真实协议与域名。
- 配置 HTTPS 后：
  - `CORS_ALLOWED_ORIGINS` 和 `VITE_API_BASE_URL` 应使用 `https://`。
  - 用户与后端、前端与后端之间的 API Key 和会话数据经 TLS 加密，更安全。

## 4. 端口与防火墙

- 若直接暴露服务：前端 80、后端 8000 需在防火墙/安全组放行。
- 若使用反向代理，通常只开放 80/443，由 Nginx/Caddy 转发到容器，后端 8000 可不对外暴露，仅本机或 Docker 网络访问。

## 5. 健康检查与监控

- 后端提供健康检查接口：`GET /api/v1/health`，可用于：
  - 容器健康检查（`docker compose` 或 K8s `livenessProbe`）
  - 负载均衡或监控探活
- 建议在编排或监控中配置该接口，便于发现服务不可用。

## 6. 部署检查清单

| 项 | 说明 |
|----|------|
| `VITE_API_BASE_URL` | 设为用户浏览器可访问的后端地址，并**重新构建**前端镜像 |
| `CORS_ALLOWED_ORIGINS` | 设为实际前端访问的 origin 列表（JSON 数组） |
| 密钥与 `.env` | 不在 Git 中提交；在服务器单独配置并限制权限 |
| 数据卷 | 为 SQLite/Chroma 等挂载持久化卷，避免容器重建丢数据 |
| HTTPS | 使用反向代理配置 TLS，并统一使用 `https://` 的 URL |
| 端口/防火墙 | 按实际拓扑开放端口或只暴露 80/443 |
| 健康检查 | 使用 `/api/v1/health` 做探活或监控 |

按上述项检查后，再执行 `docker compose up -d`（或先 `build` 再 `up`）即可在服务器上稳定运行。

---

## 7. Zeabur 部署示例（域名 doc-qa-api.zeabur.app）

若后端域名为 **https://doc-qa-api.zeabur.app**，在 Zeabur 或本地构建时建议配置：

| 变量 | 建议值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | `https://doc-qa-api.zeabur.app` | 前端构建时写入，浏览器请求的后端地址（不要带末尾斜杠） |
| `CORS_ALLOWED_ORIGINS` | `["https://doc-qa-api.zeabur.app"]` | 若前端也部署在同一域名下（同域），填该域名即可 |

若前端部署在**另一个地址**（例如 `https://doc-qa.zeabur.app`），则：

- `VITE_API_BASE_URL` 仍为 `https://doc-qa-api.zeabur.app`（后端地址）。
- `CORS_ALLOWED_ORIGINS` 需包含**前端**的访问来源，例如：`["https://doc-qa.zeabur.app"]`，或同域+跨域都允许：`["https://doc-qa-api.zeabur.app","https://doc-qa.zeabur.app"]`。

在项目根目录创建 `.env`（不提交 Git），内容示例：

```env
VITE_API_BASE_URL=https://doc-qa-api.zeabur.app
CORS_ALLOWED_ORIGINS=["https://doc-qa-api.zeabur.app"]
```

然后执行：

```bash
docker compose build
docker compose up -d
```

在 Zeabur 控制台部署时，在对应服务（backend / frontend）的环境变量中配置上述变量即可；前端需在**构建阶段**传入 `VITE_API_BASE_URL`。

---

## 8. 本地 Docker 运行常见问题

### 前端报 `GET http://localhost:8000/api/v1/... net::ERR_EMPTY_RESPONSE`

表示浏览器请求后端时连接被关闭且未收到任何响应，常见原因与处理如下：

1. **后端尚未就绪**  
   当前 `docker-compose.yml` 已为 backend 配置健康检查，且 frontend 依赖 `backend` 的 `service_healthy`，因此前端容器会在后端通过健康检查后再启动。若你使用的是旧版 compose 或曾修改过配置，请确认：
   - backend 的 `healthcheck` 指向 `GET /api/v1/health`
   - frontend 的 `depends_on.backend` 使用 `condition: service_healthy`
   - 首次启动或后端较慢时，可多等几十秒再访问前端页面。

2. **后端启动失败或崩溃**  
   在项目根目录执行：
   ```bash
   docker compose logs backend
   ```
   查看是否有报错（如依赖缺失、数据库/向量库路径权限、嵌入模型加载失败等）。根据日志修复后重新 `docker compose up --build`。

3. **本地使用了生产用 .env**  
   若从 `.env.example` 复制了 `.env` 且未改回本地配置，可能把 `VITE_API_BASE_URL` 设成了远程地址，或把 `CORS_ALLOWED_ORIGINS` 设成仅允许生产域名。本地用 Docker 时建议：
   - 不创建 `.env`（使用 compose 内默认的 `http://localhost:8000` 和已包含 `http://localhost` 的 CORS），或
   - 在 `.env` 中设置：`VITE_API_BASE_URL=http://localhost:8000`，`CORS_ALLOWED_ORIGINS=["http://localhost","http://127.0.0.1","http://localhost:80"]`，然后重新构建前端：`docker compose build frontend`。

4. **端口占用**  
   确认本机 8000 端口未被其他进程占用：`lsof -i :8000`（macOS/Linux）。若被占用，可改 compose 中 backend 的端口映射，例如 `"8001:8000"`，并相应将前端的 `VITE_API_BASE_URL` 设为 `http://localhost:8001` 后重新构建前端。
