---
name: docker-run-backend
description: Runs or updates the Doc QA backend in Docker. Rebuilds the backend image and (re)starts the container so the running instance uses the latest code. Use when the user asks to run the backend with Docker, start the backend in Docker, update the Docker backend instance, or says a backend instance is already running and wants to update it.
---

# Docker 运行 / 更新后端

## 何时使用

- 用户要求「Docker 运行后端」「用 Docker 启动后端」
- 用户说「已经启动了一个实例，更新这个实例」「重建后端容器」「让当前 Docker 后端用最新代码」

## 工作流

1. **查看当前状态**（可选）：在项目根目录执行 `docker compose ps`，确认 `backend` 服务是否在跑。
2. **构建并启动/更新**：在项目根目录执行：
   ```bash
   docker compose up -d --build backend
   ```
   - 若容器未运行：会构建镜像并启动容器。
   - 若容器已在运行：会重新构建镜像、替换并重启容器，相当于更新当前实例。
3. **确认**：`docker compose ps backend`，并可请求 `GET http://localhost:8000/api/v1/health` 验证（期望 200）。

## 项目约定

- 工作目录：仓库根目录（含 `docker-compose.yml` 的目录）。
- 服务名：`backend`；容器名：`doc-qa-backend`。
- 端口：`8000`，API 基地址：`http://localhost:8000`。

## 常用命令

| 用途       | 命令 |
|------------|------|
| 查看日志   | `docker compose logs -f backend` |
| 仅启动不重建 | `docker compose up -d backend` |
| 停止       | `docker compose stop backend` |
| 重建并启动 | `docker compose up -d --build backend` |

## 注意

- 不要假设用户本机已安装 Docker；若执行失败，可提示检查 Docker 是否安装并运行。
- 更新实例时统一用 `docker compose up -d --build backend`，无需先 `stop` 再 `up`。
