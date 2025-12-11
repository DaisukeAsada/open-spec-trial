FROM mcr.microsoft.com/devcontainers/typescript-node:24

# PostgreSQL クライアントをインストール（psql コマンド用）
RUN apt-get update && apt-get install -y postgresql-client redis-tools && rm -rf /var/lib/apt/lists/*
