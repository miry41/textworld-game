#!/bin/bash

# GCPプロジェクト立ち上げスクリプト

set -e

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GCP プロジェクト立ち上げスクリプト ===${NC}"
echo ""

# プロジェクト設定
PROJECT_ID="textworld-game-476512"
PROJECT_NAME="TextWorld Game"
REGION="asia-northeast1"
SERVICE_NAME="textworld-backend"

echo -e "${BLUE}プロジェクトID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}リージョン: ${REGION}${NC}"
echo -e "${BLUE}サービス名: ${SERVICE_NAME}${NC}"
echo ""

# プロジェクトの作成
echo -e "${YELLOW}1. プロジェクトを作成中...${NC}"
if gcloud projects describe ${PROJECT_ID} &>/dev/null; then
    echo -e "${GREEN}✓ プロジェクトは既に存在します${NC}"
else
    gcloud projects create ${PROJECT_ID} --name="${PROJECT_NAME}"
    echo -e "${GREEN}✓ プロジェクトを作成しました${NC}"
fi
echo ""

# プロジェクトを設定
echo -e "${YELLOW}2. プロジェクトを設定中...${NC}"
gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✓ プロジェクトを設定しました${NC}"
echo ""

# 課金アカウントのリンク確認
echo -e "${YELLOW}3. 課金アカウントを確認中...${NC}"
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" --limit=1)
if [ -z "$BILLING_ACCOUNT" ]; then
    echo -e "${RED}エラー: 課金アカウントが見つかりません${NC}"
    echo -e "${YELLOW}https://console.cloud.google.com/billing でアカウントを作成してください${NC}"
    exit 1
fi

# プロジェクトに課金アカウントをリンク
if gcloud billing projects describe ${PROJECT_ID} &>/dev/null; then
    echo -e "${GREEN}✓ 課金アカウントは既にリンクされています${NC}"
else
    gcloud billing projects link ${PROJECT_ID} --billing-account=${BILLING_ACCOUNT}
    echo -e "${GREEN}✓ 課金アカウントをリンクしました${NC}"
fi
echo ""

# 必要なAPIを有効化
echo -e "${YELLOW}4. 必要なAPIを有効化中...${NC}"
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudresourcemanager.googleapis.com
echo -e "${GREEN}✓ APIを有効化しました${NC}"
echo ""

# リージョン設定
echo -e "${YELLOW}5. リージョンを設定中...${NC}"
gcloud config set run/region ${REGION}
echo -e "${GREEN}✓ リージョンを設定しました${NC}"
echo ""

echo -e "${GREEN}=== セットアップ完了！ ===${NC}"
echo ""
echo -e "${YELLOW}次のステップ：${NC}"
echo "  ./deploy.sh を実行してバックエンドをデプロイ"
echo ""
echo -e "${BLUE}プロジェクト情報：${NC}"
echo "  プロジェクトID: ${PROJECT_ID}"
echo "  リージョン: ${REGION}"
echo "  サービス名: ${SERVICE_NAME}"
echo ""

