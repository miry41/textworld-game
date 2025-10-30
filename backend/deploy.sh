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

# Secret Managerの設定
SECRET_NAME="gemini-api-key"
USE_EXISTING_SECRET=false

# 既存のシークレットを確認
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}既存のGemini APIキー(Secret Manager)が見つかりました${NC}"
    read -p "既存のシークレットを使用しますか? (y/n): " USE_EXISTING
    if [ "$USE_EXISTING" = "y" ] || [ "$USE_EXISTING" = "Y" ]; then
        USE_EXISTING_SECRET=true
        echo -e "${GREEN}既存のシークレットを使用します${NC}"
    else
        read -p "新しいGemini API Keyを入力してください: " GEMINI_API_KEY
        if [ ! -z "$GEMINI_API_KEY" ]; then
            echo -e "${YELLOW}既存のシークレットを更新します${NC}"
            echo -n "$GEMINI_API_KEY" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
            USE_EXISTING_SECRET=true
        fi
    fi
    echo ""
else
    # 新規作成
    read -p "Gemini API Key (空白でスキップ): " GEMINI_API_KEY
    echo ""
    
    if [ ! -z "$GEMINI_API_KEY" ]; then
        echo -e "${GREEN}Secret Managerにgemini-api-keyを設定します...${NC}"
        
        # Secret Manager APIが有効か確認
        if ! gcloud services list --enabled --filter="name:secretmanager.googleapis.com" --format="value(name)" | grep -q secretmanager; then
            echo -e "${YELLOW}Secret Manager APIを有効化します...${NC}"
            gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID
        fi
        
        echo -e "${YELLOW}新規シークレットを作成します${NC}"
        echo -n "$GEMINI_API_KEY" | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID
        
        # サービスアカウントに権限を付与
        PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
        gcloud secrets add-iam-policy-binding $SECRET_NAME \
          --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
          --role="roles/secretmanager.secretAccessor" \
          --project=$PROJECT_ID
        
        USE_EXISTING_SECRET=true
        echo ""
    fi
fi

echo -e "${GREEN}デプロイを開始します...${NC}"
echo ""

# Cloud Runにデプロイ
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --update-env-vars FRONTEND_URL=${FRONTEND_URL}"

# Gemini APIキーが設定されている場合は、シークレットとして追加
if [ "$USE_EXISTING_SECRET" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --update-secrets GEMINI_API_KEY=${SECRET_NAME}:latest"
fi

# デプロイ実行
eval $DEPLOY_CMD

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

