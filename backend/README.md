# TextWorld × LLM Adventure - Backend

TextWorld ゲームエンジンと Gemini AI を統合したバックエンド API

---

## 📚 ドキュメント

このバックエンドの開発には、以下のドキュメントを参照してください：

| ドキュメント | 内容 | 用途 |
|------------|------|------|
| **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** | 開発計画・フェーズ分け | プロジェクト全体の進め方を理解する |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | アーキテクチャ設計 | システム構造と各コンポーネントの責務を理解する |
| **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** | 実装ガイド・コード例 | 実際に実装する際の参考にする |
| **README.md** (このファイル) | セットアップ・使い方 | 環境構築とAPI仕様 |

---

## 🚀 クイックスタート

### 1. 前提条件

- Python 3.10 以上
- pip
- Gemini API キー（オプション、AIモードで必要）

### 2. セットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# 仮想環境作成
python -m venv venv

# 仮想環境有効化
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .env ファイルを編集してAPIキーを設定
```

### 3. 環境変数設定

`.env` ファイルを編集：

```env
# 必須: Gemini API キー（自動モードで必要）
GEMINI_API_KEY=your_gemini_api_key_here

# オプション: その他の設定
DEBUG=true
LOG_LEVEL=INFO
```

### 4. 開発サーバー起動

```bash
uvicorn app.main:app --reload --port 8000
```

起動後、以下にアクセスできます：

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🏗️ プロジェクト構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーション
│   ├── config.py               # 設定管理
│   ├── models/                 # データモデル
│   │   ├── game.py             # ゲーム関連モデル
│   │   └── requests.py         # リクエスト/レスポンスモデル
│   ├── services/               # ビジネスロジック
│   │   ├── textworld_service.py  # TextWorld統合
│   │   └── gemini_service.py     # Gemini AI統合
│   ├── api/                    # エンドポイント
│   │   ├── game.py             # ゲーム操作
│   │   └── ai.py               # AI関連
│   └── core/                   # コア機能
│       ├── session_manager.py  # セッション管理
│       └── exceptions.py       # カスタム例外
├── games/                      # TextWorldゲームファイル
│   └── simple_game.z8
├── tests/                      # テスト
├── requirements.txt            # 依存関係
├── .env.example                # 環境変数テンプレート
├── README.md                   # このファイル
├── DEVELOPMENT_PLAN.md         # 開発計画
├── ARCHITECTURE.md             # アーキテクチャ設計
└── IMPLEMENTATION_GUIDE.md     # 実装ガイド
```

---

## 🔌 API エンドポイント

### 1. ヘルスチェック

```http
GET /healthz
```

**レスポンス:**
```json
{
  "status": "ok",
  "app_name": "TextWorld × LLM Adventure API",
  "gemini_api_configured": true
}
```

---

### 2. ゲームリセット

新規ゲームセッションを作成

```http
POST /reset
Content-Type: application/json

{
  "game_id": "simple_game"
}
```

**レスポンス:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation": "You are in a small room...",
  "available_actions": ["go north", "take key", "examine chest"],
  "score": 0,
  "reward": null,
  "done": false,
  "max_steps": 100,
  "current_step": 0
}
```

---

### 3. アクション実行

指定されたアクションを実行

```http
POST /step
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "go north"
}
```

**レスポンス:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation": "You move north. You see a large door.",
  "available_actions": ["go south", "open door", "examine door"],
  "score": 1,
  "reward": 1,
  "done": false,
  "max_steps": 100,
  "current_step": 1
}
```

---

### 4. AI推奨アクション取得

Gemini AI に推奨アクションを提案させる

```http
POST /gemini/suggest-action
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation": "You are in a small room...",
  "available_actions": ["go north", "take key", "examine chest"],
  "score": 0,
  "user_instruction": "鍵を探してください"
}
```

**レスポンス:**
```json
{
  "suggested_action": "take key",
  "reasoning": "AI analysis: 鍵を取得することでドアを開けられる可能性があります",
  "is_fallback": false
}
```

**注意**: `user_instruction` はオプション。Gemini APIが設定されていない場合は、`is_fallback: true` でランダムアクションを返します。

---

## 🧪 テスト

### ユニットテスト実行

```bash
pytest tests/ -v
```

### カバレッジ確認

```bash
pytest tests/ --cov=app --cov-report=html
```

### 手動テスト (cURL)

```bash
# ヘルスチェック
curl http://localhost:8000/healthz

# ゲームリセット
curl -X POST http://localhost:8000/reset \
  -H "Content-Type: application/json" \
  -d '{"game_id": "simple_game"}'

# アクション実行
curl -X POST http://localhost:8000/step \
  -H "Content-Type: application/json" \
  -d '{"session_id": "your-session-id", "action": "go north"}'

# AI推奨アクション
curl -X POST http://localhost:8000/gemini/suggest-action \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "observation": "You are in a room",
    "available_actions": ["go north", "go south"],
    "score": 0
  }'
```

---

## 🔧 開発

### 依存関係追加

```bash
pip install package-name
pip freeze > requirements.txt
```

### ロギングレベル変更

`.env` ファイルで設定：

```env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### 新しいゲーム追加

1. ゲームファイル（.z8, .ulx等）を `games/` ディレクトリに配置
2. フロントエンドの `GAMES` 配列に追加

---

## 📦 依存関係

主要なライブラリ：

- **FastAPI** - Webフレームワーク
- **Uvicorn** - ASGIサーバー
- **Pydantic** - データバリデーション
- **TextWorld** - ゲームエンジン
- **google-generativeai** - Gemini AI SDK
- **httpx** - HTTPクライアント
- **python-dotenv** - 環境変数管理

詳細は `requirements.txt` を参照。

---

## 🐛 トラブルシューティング

### TextWorldが動作しない

```bash
# TextWorldを再インストール
pip uninstall textworld
pip install textworld
```

### Gemini APIエラー

- APIキーが正しく設定されているか確認
- APIキーの制限や課金状況を確認
- ログで詳細なエラーメッセージを確認

### セッションが見つからない

- セッションタイムアウト（デフォルト1時間）を確認
- サーバー再起動後はセッションがクリアされます（メモリ内保存のため）

### CORS エラー

`.env` ファイルで許可するオリジンを設定：

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🚢 デプロイ

### 本番環境での実行

```bash
# Gunicorn + Uvicorn workers
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Docker化（オプション）

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# ビルド
docker build -t textworld-backend .

# 実行
docker run -p 8000:8000 --env-file .env textworld-backend
```

---

## 📈 パフォーマンス

### 現在の実装

- **セッション管理**: メモリ内（辞書）
- **同時接続**: 中規模（~100セッション）
- **レスポンスタイム**: < 200ms（通常）

### 将来の改善案

- Redis for session store（スケーラビリティ向上）
- データベースでゲーム履歴保存
- キャッシング戦略
- 非同期処理の最適化

---

## 🔐 セキュリティ

### 実装済み

- ✅ CORS設定
- ✅ 入力バリデーション（Pydantic）
- ✅ 環境変数でAPIキー管理
- ✅ エラーハンドリング

### 将来の改善

- ⏸ レート制限（SlowAPI）
- ⏸ 認証/認可（JWT）
- ⏸ リクエストログ

---

## 📝 開発の進め方

1. **Phase 1から順に実装**
   - [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) を参照

2. **各Phaseで動作確認**
   - Swagger UI でテスト
   - cURL or Postman でエンドポイント確認

3. **フロントエンドとの連携**
   - フロントエンドを起動して統合テスト

4. **ドキュメント更新**
   - 実装に合わせてドキュメントを更新

---

## 🤝 コントリビューション

1. 機能追加前に [ARCHITECTURE.md](./ARCHITECTURE.md) を確認
2. コーディング規約に従う（PEP 8）
3. テストを書く
4. ドキュメントを更新

---

## 📄 ライセンス

MIT

---

## 👥 開発者

TextWorld × LLM Adventure Backend Team

---

## 🔗 関連リンク

- [TextWorld GitHub](https://github.com/Microsoft/TextWorld)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## 📞 サポート

質問や問題がある場合は、以下のドキュメントを確認してください：

1. [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - 開発計画
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ
3. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - 実装ガイド

それでも解決しない場合は、Issue を作成してください。

