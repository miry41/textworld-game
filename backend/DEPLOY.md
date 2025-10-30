# Google Cloud Run デプロイガイド

このドキュメントでは、TextWorld Game BackendをGoogle Cloud Runにデプロイする方法を説明します。

## 📋 前提条件

1. **Google Cloud アカウント**
   - GCPプロジェクトが作成済み
   - 課金が有効化されている

2. **gcloud CLI のインストール**
   ```bash
   # インストール確認
   gcloud --version
   
   # まだの場合はインストール
   # https://cloud.google.com/sdk/docs/install
   ```

3. **gcloud の認証**
   ```bash
   # ログイン
   gcloud auth login
   
   # プロジェクトを設定
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **必要な API の有効化**
   ```bash
   # Cloud Run API を有効化
   gcloud services enable run.googleapis.com
   
   # Artifact Registry API を有効化（イメージ保存用）
   gcloud services enable artifactregistry.googleapis.com
   
   # Cloud Build API を有効化
   gcloud services enable cloudbuild.googleapis.com
   ```

## 🚀 デプロイ手順

### 1. リージョンの設定（オプション）

```bash
# デフォルトは asia-northeast1 (東京)
gcloud config set run/region asia-northeast1
```

利用可能なリージョン：
- `asia-northeast1` - 東京
- `asia-northeast2` - 大阪
- `us-central1` - アイオワ
- `europe-west1` - ベルギー

### 2. デプロイスクリプトの実行

```bash
cd backend
./deploy.sh
```

スクリプトが以下を要求します：
1. **フロントエンドURL**: Vercel等にデプロイしたフロントエンドのURL
   - 例: `https://your-app.vercel.app`
2. **Gemini API Key**: Google AI StudioまたはGoogle Cloud から取得
   - 取得方法: https://ai.google.dev/

### 3. デプロイ完了

デプロイが成功すると、Service URLが表示されます：
```
Service URL: https://textworld-game-backend-xxxxx-xx.a.run.app
```

このURLをコピーしてください。

## 🔗 フロントエンドとの連携

### Vercel の場合

1. Vercelのプロジェクト設定を開く
2. **Settings** → **Environment Variables**
3. 以下の環境変数を追加：
   - **Name**: `VITE_API_URL`
   - **Value**: （コピーしたService URL）
4. **Save** をクリック
5. **Deployments** タブから再デプロイ

### その他のホスティングサービス

環境変数 `VITE_API_URL` にバックエンドのURLを設定し、再デプロイしてください。

## 🔧 詳細設定

### 環境変数の更新

デプロイ後に環境変数を更新する場合：

```bash
gcloud run services update textworld-game-backend \
  --update-env-vars GEMINI_API_KEY=new_api_key
```

### リソース設定の変更

メモリやCPUを変更する場合：

```bash
gcloud run services update textworld-game-backend \
  --memory 4Gi \
  --cpu 4
```

### 再デプロイ

コードを更新した後の再デプロイ：

```bash
cd backend
./deploy.sh
```

または、手動で：

```bash
gcloud run deploy textworld-game-backend \
  --source . \
  --region asia-northeast1
```

## 📊 モニタリング

### ログの確認

```bash
# リアルタイムログ
gcloud run services logs tail textworld-game-backend

# 最新のログ
gcloud run services logs read textworld-game-backend --limit 50
```

### Cloud Console でのモニタリング

1. [Cloud Run Console](https://console.cloud.google.com/run) にアクセス
2. `textworld-game-backend` サービスをクリック
3. 以下のタブで情報を確認：
   - **METRICS**: CPU、メモリ、リクエスト数
   - **LOGS**: アプリケーションログ
   - **REVISIONS**: デプロイ履歴

## 💰 コスト管理

### Cloud Run の料金

- **無料枠**: 毎月 200万リクエスト、36万GB秒のコンピューティング時間
- **従量課金**: 
  - リクエスト数に応じた課金
  - 実行時間に応じた課金
  - メモリ使用量に応じた課金

詳細: https://cloud.google.com/run/pricing

### コスト削減のヒント

1. **最小インスタンス数を0に設定**（デフォルト）
   - アイドル時は課金されない
   
2. **リソースを適切にサイズ設定**
   - 不要に大きなメモリ/CPUを避ける

3. **タイムアウトを適切に設定**
   - デフォルト: 300秒

## 🔐 セキュリティ

### 認証の追加（オプション）

現在は `--allow-unauthenticated` で誰でもアクセス可能です。

認証を追加する場合：

```bash
# 未認証アクセスを無効化
gcloud run services update textworld-game-backend \
  --no-allow-unauthenticated

# Cloud IAM で適切なロールを付与
```

### シークレット管理

環境変数の代わりにSecret Managerを使用：

```bash
# シークレットを作成
echo -n "your-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Cloud Runサービスに接続
gcloud run services update textworld-game-backend \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## 🐛 トラブルシューティング

### デプロイが失敗する

1. **ビルドエラー**
   ```bash
   # ローカルでDockerビルドをテスト
   docker build -t test-image .
   ```

2. **権限エラー**
   ```bash
   # 必要な権限を確認
   gcloud projects get-iam-policy YOUR_PROJECT_ID
   ```

### サービスが起動しない

1. **ログを確認**
   ```bash
   gcloud run services logs read textworld-game-backend --limit 100
   ```

2. **ヘルスチェックを確認**
   ```bash
   curl https://your-service-url/healthz
   ```

### CORS エラー

1. **FRONTEND_URL が正しく設定されているか確認**
   ```bash
   gcloud run services describe textworld-game-backend \
     --format="value(spec.template.spec.containers[0].env)"
   ```

2. **フロントエンドのURLが完全一致しているか確認**
   - プロトコル（https://）を含む
   - 末尾のスラッシュなし

## 📚 関連リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [gcloud CLI リファレンス](https://cloud.google.com/sdk/gcloud/reference/run)
- [Cloud Run 料金](https://cloud.google.com/run/pricing)
- [Gemini API ドキュメント](https://ai.google.dev/)

## 🆘 サポート

問題が解決しない場合は、以下を確認してください：
1. [README.md](./README.md) - 基本的な使い方
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ
3. Cloud Run のログとメトリクス

---

Happy Deploying! 🚀

