#!/bin/bash

# バックエンドをGoogle Cloud Runにデプロイするスクリプト

set -e

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TextWorld Game Backend デプロイスクリプト ===${NC}"
echo ""

# プロジェクトIDの設定
PROJECT_ID="textworld-game-476512"
SERVICE_NAME="textworld-backend"

# プロジェクトが設定されているか確認
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}プロジェクトを ${PROJECT_ID} に設定します${NC}"
    gcloud config set project $PROJECT_ID
fi
echo -e "${GREEN}プロジェクトID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}サービス名: ${SERVICE_NAME}${NC}"
echo ""

# リージョンの確認
REGION=$(gcloud config get-value run/region 2>/dev/null)
if [ -z "$REGION" ]; then
    REGION="asia-northeast1"
    echo -e "${YELLOW}リージョンが設定されていません。デフォルト(${REGION})を使用します${NC}"
    gcloud config set run/region $REGION
fi
echo -e "${GREEN}リージョン: ${REGION}${NC}"
echo ""

# フロントエンドURLの入力
read -p "フロントエンドURL (例: https://your-app.vercel.app): " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}フロントエンドURLが必要です${NC}"
    exit 1
fi
echo ""

# Gemini APIキーの入力
read -p "Gemini API Key: " GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}警告: Gemini APIキーが設定されていません${NC}"
    echo -e "${YELLOW}AIモードは動作しませんが、デプロイを続行します${NC}"
    echo ""
fi
echo ""

echo -e "${GREEN}デプロイを開始します...${NC}"
echo ""

# 環境変数の準備
ENV_VARS="FRONTEND_URL=${FRONTEND_URL}"
if [ ! -z "$GEMINI_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},GEMINI_API_KEY=${GEMINI_API_KEY}"
fi

# Cloud Runにデプロイ
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "${ENV_VARS}"

echo ""
echo -e "${GREEN}=== デプロイ完了！ ===${NC}"
echo ""
echo -e "${YELLOW}次のステップ：${NC}"
echo "1. 上記に表示されたService URLをコピー"
echo "2. フロントエンドプロジェクトの環境変数に追加："
echo "   - Name: VITE_API_URL"
echo "   - Value: (コピーしたService URL)"
echo "3. フロントエンドを再デプロイ"
echo ""
echo -e "${YELLOW}注意事項：${NC}"
echo "- ゲームファイル (games/*.z8) も一緒にデプロイされます"
echo "- TextWorldの依存関係は自動でインストールされます"
echo "- ログは Cloud Console で確認できます"
echo ""

