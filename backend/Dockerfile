FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 应用默认配置（可被运行时 env / fly secrets 覆盖；敏感项勿写此处）
ENV PORT=8000 \
    API_PREFIX=/api/v1 \
    DATABASE_URL=sqlite+aiosqlite:///./doc_qa.db \
    CHROMA_PERSIST_PATH=./data/chroma \
    USE_VECTOR_SEARCH=true
# CORS 为 JSON 数组，部署时按前端域名覆盖；含 localhost 以支持 Docker 前端 80 端口
ENV CORS_ALLOWED_ORIGINS="[\"http://localhost:5173\",\"http://127.0.0.1:5173\",\"http://localhost\",\"http://127.0.0.1\"]"

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY .env.example ./.env.example

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
