# バックエンドアーキテクチャ設計書

## システム概要

TextWorld × LLM Adventure のバックエンドは、FastAPIベースのRESTful APIサーバーとして実装され、以下の主要コンポーネントで構成されます。

---

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  - Manual Play Mode                                          │
│  - Auto Play Mode                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   FastAPI Application                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Layer (Routers)                       │ │
│  │  - /reset, /step                (game.py)             │ │
│  │  - /gemini/suggest-action       (ai.py)               │ │
│  │  - /healthz                     (main.py)             │ │
│  └────────────┬────────────────────┬──────────────────────┘ │
│               │                    │                         │
│  ┌────────────▼──────────┐  ┌─────▼────────────────────┐   │
│  │  TextWorld Service    │  │   Gemini Service         │   │
│  │  - Game initialization│  │   - API client           │   │
│  │  - Action execution   │  │   - Prompt engineering   │   │
│  │  - State management   │  │   - Fallback logic       │   │
│  └────────────┬──────────┘  └─────┬────────────────────┘   │
│               │                    │                         │
│  ┌────────────▼────────────────────▼──────────────────────┐ │
│  │             Session Manager (In-Memory)                 │ │
│  │  - Session ID → Game State mapping                     │ │
│  │  - Lifecycle management                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
       ┌───────▼────────┐        ┌───────▼─────────┐
       │  TextWorld     │        │  Gemini API     │
       │  Engine        │        │  (External)     │
       │  (.z8 games)   │        └─────────────────┘
       └────────────────┘
```

---

## コンポーネント詳細

### 1. API Layer (Routers)

#### 責務
- HTTPリクエストの受け取り
- リクエストバリデーション（Pydantic）
- サービス層の呼び出し
- レスポンスの整形
- エラーハンドリング

#### ファイル構成
- `api/game.py` - ゲーム操作エンドポイント
- `api/ai.py` - AI関連エンドポイント
- `main.py` - アプリケーション初期化、ヘルスチェック

---

### 2. Service Layer

#### TextWorld Service (`services/textworld_service.py`)

**責務**:
- TextWorldゲームエンジンのラッパー
- ゲームの初期化とリセット
- アクションの実行
- ゲーム状態の取得

**主要メソッド**:
```python
class TextWorldService:
    def initialize_game(self, game_id: str) -> GameState:
        """ゲームを初期化し、初期状態を返す"""
        
    def execute_action(self, session_id: str, action: str) -> GameState:
        """アクションを実行し、新しい状態を返す"""
        
    def get_available_actions(self, session_id: str) -> List[str]:
        """利用可能なアクションリストを取得"""
        
    def get_observation(self, session_id: str) -> str:
        """現在の観察結果を取得"""
```

**技術詳細**:
- TextWorldのPythonライブラリを使用
- ゲームファイル（.z8）を読み込み
- ゲームインスタンスをセッション管理に委譲

---

#### Gemini Service (`services/gemini_service.py`)

**責務**:
- Gemini APIクライアントの管理
- プロンプト生成
- アクション提案の取得
- フォールバック処理（API未設定時）

**主要メソッド**:
```python
class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        """APIキーでクライアント初期化"""
        
    def suggest_action(
        self,
        observation: str,
        available_actions: List[str],
        score: int,
        user_instruction: Optional[str] = None
    ) -> ActionSuggestion:
        """AI推奨アクションを取得"""
        
    def _build_prompt(self, ...) -> str:
        """プロンプトを構築"""
        
    def _parse_response(self, response: str) -> str:
        """レスポンスをパースしてアクションを抽出"""
```

**プロンプト設計**:
```
あなたはテキストアドベンチャーゲームのプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を選択してください。

【現在の状況】
{observation}

【利用可能なアクション】
{available_actions}

【現在のスコア】
{score}

【プレイヤーの指示】（オプション）
{user_instruction}

【目標】
ゲームをクリアすることです。適切なアクションを1つ選択してください。

選択するアクション:
```

**フォールバック**:
- APIキー未設定 → ランダムアクション選択
- API呼び出し失敗 → ランダムアクション選択
- タイムアウト → ランダムアクション選択

---

### 3. Core Components

#### Session Manager (`core/session_manager.py`)

**責務**:
- セッションIDの生成
- セッションとゲーム状態のマッピング
- セッションのライフサイクル管理
- 古いセッションのクリーンアップ

**実装方式**:
```python
class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, GameSession] = {}
        
    def create_session(self, game_id: str) -> str:
        """新規セッションを作成しIDを返す"""
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = GameSession(
            session_id=session_id,
            game_id=game_id,
            created_at=datetime.now(),
            game_instance=None  # TextWorldServiceが設定
        )
        return session_id
        
    def get_session(self, session_id: str) -> GameSession:
        """セッションを取得"""
        
    def delete_session(self, session_id: str):
        """セッションを削除"""
        
    def cleanup_old_sessions(self, timeout: int = 3600):
        """古いセッションをクリーンアップ"""
```

**データ構造**:
```python
@dataclass
class GameSession:
    session_id: str
    game_id: str
    created_at: datetime
    last_accessed: datetime
    game_instance: Any  # TextWorldのゲームインスタンス
    history: List[GameStep]  # アクション履歴
```

---

#### Exception Handling (`core/exceptions.py`)

**カスタム例外**:
```python
class GameSessionNotFound(Exception):
    """セッションが見つからない"""
    pass

class InvalidGameAction(Exception):
    """無効なアクション"""
    pass

class GeminiAPIError(Exception):
    """Gemini API呼び出しエラー"""
    pass

class TextWorldError(Exception):
    """TextWorldエンジンエラー"""
    pass
```

**エラーハンドラー**（`main.py`）:
```python
@app.exception_handler(GameSessionNotFound)
async def session_not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Session not found", "detail": str(exc)}
    )

@app.exception_handler(InvalidGameAction)
async def invalid_action_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid action", "detail": str(exc)}
    )
```

---

### 4. Data Models

#### Pydanticモデル (`models/`)

**リクエストモデル**:
```python
# models/requests.py

class ResetRequest(BaseModel):
    game_id: str

class StepRequest(BaseModel):
    session_id: str
    action: str

class SuggestActionRequest(BaseModel):
    session_id: str
    observation: str
    available_actions: List[str]
    score: int
    user_instruction: Optional[str] = None
```

**レスポンスモデル**:
```python
# models/game.py

class GameState(BaseModel):
    session_id: str
    observation: str
    available_actions: List[str]
    score: int
    reward: Optional[int] = None
    done: bool
    max_steps: int

class ActionSuggestion(BaseModel):
    suggested_action: str
    reasoning: Optional[str] = None
    is_fallback: bool = False

class HealthResponse(BaseModel):
    status: str
    gemini_api_configured: bool
```

---

## データフロー

### 1. ゲーム初期化フロー (POST /reset)

```
Frontend
  │
  ├─ POST /reset
  │  Body: { game_id: "simple_game" }
  │
  ▼
API Layer (game.py)
  │
  ├─ バリデーション (Pydantic)
  │
  ▼
SessionManager
  │
  ├─ create_session() → session_id
  │
  ▼
TextWorldService
  │
  ├─ initialize_game(game_id)
  ├─ ゲームファイル読み込み
  ├─ 初期状態取得
  │
  ▼
Response
  │
  └─ GameState {
       session_id, observation,
       available_actions, score, done
     }
```

---

### 2. アクション実行フロー (POST /step)

```
Frontend
  │
  ├─ POST /step
  │  Body: { session_id, action: "go north" }
  │
  ▼
API Layer (game.py)
  │
  ├─ バリデーション
  │
  ▼
SessionManager
  │
  ├─ get_session(session_id)
  │
  ▼
TextWorldService
  │
  ├─ execute_action(session_id, action)
  ├─ TextWorldエンジンに渡す
  ├─ 新しい状態を取得
  ├─ 報酬計算
  │
  ▼
Response
  │
  └─ GameState {
       observation, available_actions,
       reward, score, done
     }
```

---

### 3. AI提案フロー (POST /gemini/suggest-action)

```
Frontend
  │
  ├─ POST /gemini/suggest-action
  │  Body: { session_id, observation, available_actions, score, user_instruction }
  │
  ▼
API Layer (ai.py)
  │
  ├─ バリデーション
  │
  ▼
GeminiService
  │
  ├─ APIキー確認
  ├─ プロンプト生成
  ├─ Gemini API呼び出し
  ├─ レスポンスパース
  │  （失敗時: ランダム選択）
  │
  ▼
Response
  │
  └─ ActionSuggestion {
       suggested_action,
       reasoning,
       is_fallback
     }
```

---

## 設定管理

### Config (`app/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Gemini API
    gemini_api_key: Optional[str] = None
    
    # アプリケーション
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # セッション
    session_timeout: int = 3600  # 秒
    
    # TextWorld
    games_directory: str = "games"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

---

## セキュリティ考慮事項

### 1. APIキー管理
- 環境変数で管理（`.env`）
- コードにハードコードしない
- `.env`ファイルは`.gitignore`に追加

### 2. 入力バリデーション
- Pydanticで厳密にバリデーション
- 不正なアクションは拒否
- セッションID検証

### 3. CORS設定
- 開発環境: localhostのみ許可
- 本番環境: ホワイトリスト方式

### 4. レート制限（将来）
- SlowAPIライブラリの導入検討
- エンドポイントごとの制限設定

---

## パフォーマンス最適化

### 1. 非同期処理
```python
# Gemini API呼び出しを非同期化
async def suggest_action(...) -> ActionSuggestion:
    async with httpx.AsyncClient() as client:
        response = await client.post(...)
```

### 2. セッションクリーンアップ
```python
# バックグラウンドタスクで定期実行
from fastapi import BackgroundTasks

@app.on_event("startup")
async def startup_event():
    # 定期クリーンアップタスク登録
    asyncio.create_task(periodic_cleanup())
```

### 3. キャッシング（将来）
- Gemini APIレスポンスのキャッシュ（同じ状況での提案）
- ゲーム状態のスナップショット

---

## ロギング戦略

### ログレベル
- **DEBUG**: 詳細な開発情報
- **INFO**: 通常の操作ログ
- **WARNING**: 警告（フォールバック使用等）
- **ERROR**: エラー発生
- **CRITICAL**: 致命的エラー

### ログ内容
```python
import logging

logger = logging.getLogger(__name__)

# 例
logger.info(f"Session created: {session_id}")
logger.debug(f"Action executed: {action}, Result: {observation}")
logger.warning(f"Gemini API unavailable, using fallback")
logger.error(f"TextWorld error: {error}", exc_info=True)
```

---

## テスト戦略

### 1. ユニットテスト
- 各サービスの個別機能テスト
- モックを使用してAPIを分離

### 2. 統合テスト
- エンドポイント単位のテスト
- TestClientを使用

### 3. E2Eテスト
- フロントエンドとの連携テスト
- 実際のゲームフロー

---

## デプロイメント

### 開発環境
```bash
uvicorn app.main:app --reload --port 8000
```

### 本番環境（推奨）
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

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 拡張性

### 将来の改善案

1. **永続化**
   - PostgreSQL/MongoDBでセッション保存
   - ゲーム履歴の記録

2. **スケーラビリティ**
   - Redis for session store
   - 複数インスタンスでの負荷分散

3. **高度なAI機能**
   - 複数LLMの比較
   - エージェント学習（強化学習）
   - ゲーム攻略の最適化

4. **監視・メトリクス**
   - Prometheusメトリクス
   - ログ集約（ELKスタック）

---

## まとめ

このアーキテクチャは、以下の原則に基づいて設計されています：

✅ **関心の分離**: API層、サービス層、コア層の明確な分離
✅ **疎結合**: 各コンポーネントが独立して動作
✅ **拡張性**: 新しいゲームやAIモデルの追加が容易
✅ **保守性**: 明確な責務分担とドキュメント
✅ **テスタビリティ**: 各層が独立してテスト可能

この設計に従うことで、堅牢で保守しやすいバックエンドシステムを構築できます。

