# バックエンド開発計画

## プロジェクト概要

TextWorld × LLM Adventure のバックエンドAPI。TextWorldゲームエンジンとGemini AIを統合し、フロントエンドにゲーム状態とAI推奨アクションを提供する。

---

## 技術スタック

### コア技術
- **FastAPI** - 高速な非同期Webフレームワーク
- **Python 3.10+** - 言語
- **TextWorld** - テキストアドベンチャーゲームエンジン
- **Google Gemini API** - LLM統合
- **Uvicorn** - ASGIサーバー

### その他ライブラリ
- **pydantic** - データバリデーション
- **python-dotenv** - 環境変数管理
- **httpx** - 非同期HTTPクライアント（Gemini API呼び出し用）

---

## プロジェクト構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーションエントリーポイント
│   ├── config.py               # 設定管理（環境変数読み込み）
│   ├── models/
│   │   ├── __init__.py
│   │   ├── game.py             # ゲーム関連のPydanticモデル
│   │   └── requests.py         # リクエスト/レスポンスモデル
│   ├── services/
│   │   ├── __init__.py
│   │   ├── textworld_service.py  # TextWorld統合ロジック
│   │   └── gemini_service.py     # Gemini AI統合ロジック
│   ├── api/
│   │   ├── __init__.py
│   │   ├── game.py             # ゲーム操作エンドポイント
│   │   └── ai.py               # AI関連エンドポイント
│   └── core/
│       ├── __init__.py
│       ├── session_manager.py  # セッション管理（メモリ内）
│       └── exceptions.py       # カスタム例外
├── games/                      # TextWorldゲームファイル（.z8等）
│   └── simple_game.z8          # サンプルゲーム
├── tests/                      # テストファイル
│   ├── __init__.py
│   ├── test_game_api.py
│   └── test_gemini_service.py
├── requirements.txt            # 依存関係
├── .env.example                # 環境変数テンプレート
├── README.md                   # バックエンドのREADME
└── DEVELOPMENT_PLAN.md         # このファイル
```

---

## 開発フェーズ

### Phase 1: プロジェクトセットアップ（基礎構築）

#### タスク
1. **ディレクトリ構造作成**
   - 上記の構造に従ってディレクトリとファイルを作成
   - `__init__.py` の配置

2. **依存関係定義**
   - `requirements.txt` 作成
   - 必要なライブラリのバージョン指定

3. **環境変数設定**
   - `config.py` 実装（環境変数読み込み）
   - `.env.example` 作成（テンプレート）

4. **FastAPIアプリケーション骨組み**
   - `main.py` 実装（基本構造）
   - CORS設定
   - ヘルスチェックエンドポイント実装

#### 成果物
- [ ] ディレクトリ構造
- [ ] `requirements.txt`
- [ ] `.env.example`
- [ ] `app/config.py`
- [ ] `app/main.py`（CORS設定含む）
- [ ] `GET /healthz` エンドポイント

---

### Phase 2: TextWorld統合

#### タスク
1. **Pydanticモデル定義**
   - `models/game.py` 実装
     - `GameState`, `GameAction`, `GameObservation` 等

2. **TextWorldサービス実装**
   - `services/textworld_service.py`
     - ゲーム初期化
     - アクション実行
     - 状態取得
     - ゲームリセット

3. **セッション管理**
   - `core/session_manager.py`
     - メモリ内辞書でセッション管理
     - セッションID生成
     - タイムアウト処理（オプション）

4. **ゲームAPIエンドポイント実装**
   - `api/game.py`
     - `POST /reset` - 新規ゲームセッション作成
     - `POST /step` - アクション実行

#### 成果物
- [ ] `models/game.py`
- [ ] `models/requests.py`
- [ ] `services/textworld_service.py`
- [ ] `core/session_manager.py`
- [ ] `api/game.py`
- [ ] `POST /reset` エンドポイント
- [ ] `POST /step` エンドポイント

#### 検証方法
- cURLまたはPostmanでエンドポイントテスト
- シンプルなTextWorldゲームでの動作確認

---

### Phase 3: Gemini AI統合

#### タスク
1. **Gemini AIサービス実装**
   - `services/gemini_service.py`
     - Gemini API クライアント初期化
     - プロンプト設計（ゲーム状況→アクション提案）
     - エラーハンドリング（API制限、タイムアウト等）
     - フォールバック機能（API未設定時はランダムアクション）

2. **AIエンドポイント実装**
   - `api/ai.py`
     - `POST /gemini/suggest-action` - AI推奨アクション取得

3. **プロンプトエンジニアリング**
   - ゲーム状態を効果的にLLMに伝える
   - 利用可能なアクションリストを提示
   - 目標（ゲームクリア）を明示
   - Few-shot learningの検討

#### 成果物
- [ ] `services/gemini_service.py`
- [ ] `api/ai.py`
- [ ] `POST /gemini/suggest-action` エンドポイント
- [ ] プロンプトテンプレート

#### 検証方法
- Gemini APIキー設定後の動作確認
- APIキー未設定時のフォールバック動作確認
- 複数のゲーム状況での推奨精度チェック

---

### Phase 4: エラーハンドリング・ロギング

#### タスク
1. **カスタム例外定義**
   - `core/exceptions.py`
     - `GameSessionNotFound`
     - `InvalidGameAction`
     - `GeminiAPIError`
     - `TextWorldError`

2. **エラーハンドリング実装**
   - FastAPIの例外ハンドラー登録
   - 適切なHTTPステータスコード返却
   - フロントエンドが理解しやすいエラーメッセージ

3. **ロギング設定**
   - Python標準loggingモジュール使用
   - ログレベル設定（環境変数で制御）
   - 重要な処理のログ出力

#### 成果物
- [ ] `core/exceptions.py`
- [ ] エラーハンドラーの実装
- [ ] ロギング設定

---

### Phase 5: テスト

#### タスク
1. **ユニットテスト**
   - `tests/test_textworld_service.py`
   - `tests/test_gemini_service.py`
   - `tests/test_session_manager.py`

2. **統合テスト**
   - `tests/test_game_api.py`
   - `tests/test_ai_api.py`

3. **手動テスト**
   - フロントエンドとの連携確認
   - 各プレイモードの動作確認

#### 成果物
- [ ] ユニットテスト（カバレッジ70%以上目標）
- [ ] 統合テスト
- [ ] 手動テストチェックリスト

---

### Phase 6: ドキュメント・最適化

#### タスク
1. **ドキュメント作成**
   - `backend/README.md`
     - セットアップ手順
     - API仕様
     - 開発者向けガイド
   - API仕様書（OpenAPI自動生成活用）

2. **パフォーマンス最適化**
   - セッション管理の改善（必要に応じてRedis等の検討）
   - 非同期処理の最適化
   - Gemini APIのレスポンスキャッシング検討

3. **セキュリティ強化**
   - レート制限の実装検討
   - APIキーの安全な管理確認
   - 入力バリデーション強化

#### 成果物
- [ ] `backend/README.md`
- [ ] API仕様書（Swagger UI）
- [ ] パフォーマンス改善項目リスト

---

## API仕様（詳細）

### 1. POST /reset

**概要**: 新規ゲームセッションを作成し、初期状態を返す

**リクエストボディ**:
```json
{
  "game_id": "simple_game"
}
```

**レスポンス**:
```json
{
  "session_id": "uuid-string",
  "observation": "You are in a small room...",
  "available_actions": ["go north", "take key", "examine chest"],
  "score": 0,
  "done": false,
  "max_steps": 100
}
```

### 2. POST /step

**概要**: 指定されたアクションを実行し、結果を返す

**リクエストボディ**:
```json
{
  "session_id": "uuid-string",
  "action": "go north"
}
```

**レスポンス**:
```json
{
  "observation": "You move north. You see a large door.",
  "available_actions": ["go south", "open door", "examine door"],
  "reward": 1,
  "score": 1,
  "done": false,
  "max_steps": 100
}
```

### 3. POST /gemini/suggest-action

**概要**: Gemini AIに推奨アクションを提案させる

**リクエストボディ**:
```json
{
  "session_id": "uuid-string",
  "observation": "You are in a small room...",
  "available_actions": ["go north", "take key", "examine chest"],
  "score": 0,
  "user_instruction": "探索して鍵を見つけてください"  // オプション
}
```

**レスポンス**:
```json
{
  "suggested_action": "take key",
  "reasoning": "鍵を取得することでドアを開けられる可能性があります",
  "is_fallback": false  // Gemini API使用できない場合はtrue
}
```

### 4. GET /healthz

**概要**: ヘルスチェック

**レスポンス**:
```json
{
  "status": "ok",
  "gemini_api_configured": true
}
```

---

## 環境変数

`.env` ファイルに以下を設定:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# アプリケーション設定
DEBUG=true
LOG_LEVEL=INFO

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# セッション設定
SESSION_TIMEOUT=3600  # 秒単位
```

---

## 優先順位付きタスクリスト

### 高優先度（必須）
1. ✅ Phase 1のセットアップ
2. ✅ Phase 2のTextWorld統合
3. ✅ Phase 3のGemini AI統合
4. ✅ 基本的なエラーハンドリング

### 中優先度（重要）
5. ⏸ Phase 4の包括的なエラーハンドリング
6. ⏸ Phase 5の統合テスト
7. ⏸ ドキュメント作成

### 低優先度（改善）
8. ⏸ ユニットテスト充実
9. ⏸ パフォーマンス最適化
10. ⏸ セキュリティ強化

---

## 技術的考慮事項

### 1. セッション管理
- **初期実装**: メモリ内辞書（簡単、開発に適している）
- **将来**: Redis等の外部ストレージ（スケーラビリティ）

### 2. TextWorldゲーム配置
- ゲームファイル（.z8, .ulx等）を`games/`ディレクトリに配置
- フロントエンドのGAMES配列と同期

### 3. Gemini APIレート制限
- リトライロジック実装
- 指数バックオフ
- タイムアウト設定

### 4. 非同期処理
- FastAPIの非同期機能活用
- Gemini API呼び出しは非同期
- TextWorld操作は必要に応じて非同期化

### 5. CORS設定
- 開発環境では`http://localhost:3000`と`http://localhost:5173`を許可
- 本番環境では適切なオリジンに制限

---

## 開発時の注意点

1. **TextWorldのバージョン**: 最新の安定版を使用
2. **Gemini API**: 無料枠の制限に注意
3. **エラーメッセージ**: フロントエンドで表示するため、ユーザーフレンドリーに
4. **ログ**: 開発時はDEBUGレベル、本番はINFOレベル
5. **テスト**: 各Phase完了後に動作確認を必ず行う

---

## 開発開始コマンド

```bash
# 仮想環境作成
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 開発サーバー起動
uvicorn app.main:app --reload --port 8000

# 別ターミナルでテスト
pytest tests/ -v

# OpenAPI仕様確認
# ブラウザで http://localhost:8000/docs
```

---

## 完成目標

- ✅ フロントエンドと完全に連携するバックエンドAPI
- ✅ TextWorldゲームエンジンの安定した動作
- ✅ Gemini AIによる適切なアクション提案
- ✅ エラーハンドリングとロギング
- ✅ 基本的なテストカバレッジ
- ✅ わかりやすいドキュメント

---

## 次のステップ

**Phase 1の実装から開始してください。**

各Phaseが完了したら、このドキュメントのチェックボックスを更新してください。

