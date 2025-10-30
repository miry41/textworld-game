# TextWorld Game Backend - Cloud Run Dockerfile

FROM python:3.10-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムパッケージのインストール（TextWorldとJerichoが必要とする依存関係）
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    make \
    git \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係をコピーしてインストール
COPY requirements.txt .
# Jerichoのコンパイルエラーを回避するため、コンパイラの警告をエラーとして扱わない
ENV CFLAGS="-Wno-error=incompatible-pointer-types -Wno-error=implicit-function-declaration"
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Uvicornでアプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

