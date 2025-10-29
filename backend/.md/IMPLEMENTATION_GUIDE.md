# 実装ガイド

Phase 1から順に実装する際の具体的なコード例とベストプラクティスを記載します。

---

## Phase 1: プロジェクトセットアップ

### 1.1 requirements.txt

```txt
# Web Framework
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-dotenv==1.0.1

# Data Validation
pydantic==2.10.6
pydantic-settings==2.7.1

# HTTP Client
httpx==0.28.1

# TextWorld
textworld==1.6.2

# Google Gemini AI
google-generativeai==0.8.3

# Testing
pytest==8.3.4
pytest-asyncio==0.25.2
pytest-cov==6.0.0

# Utilities
python-multipart==0.0.20
```

---

### 1.2 app/config.py

```python
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # Gemini API
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout: int = 30  # 秒
    
    # アプリケーション
    app_name: str = "TextWorld × LLM Adventure API"
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]
    
    # セッション
    session_timeout: int = 3600  # 秒
    max_sessions: int = 100
    
    # TextWorld
    games_directory: str = "games"
    default_max_steps: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# シングルトンインスタンス
settings = Settings()
```

---

### 1.3 app/main.py（基本構造）

```python
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api import game, ai
from app.core.exceptions import (
    GameSessionNotFound,
    InvalidGameAction,
    GeminiAPIError,
    TextWorldError
)

# ロギング設定
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    logger.info(f"Starting {settings.app_name}")
    logger.info(f"Gemini API configured: {settings.gemini_api_key is not None}")
    
    # 起動時の処理
    yield
    
    # シャットダウン時の処理
    logger.info(f"Shutting down {settings.app_name}")


# FastAPIアプリケーション
app = FastAPI(
    title=settings.app_name,
    description="TextWorld game engine with Gemini AI integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(game.router, prefix="", tags=["Game"])
app.include_router(ai.router, prefix="/gemini", tags=["AI"])


# エラーハンドラー
@app.exception_handler(GameSessionNotFound)
async def session_not_found_handler(request, exc):
    logger.warning(f"Session not found: {exc}")
    return JSONResponse(
        status_code=404,
        content={"error": "Session not found", "detail": str(exc)}
    )


@app.exception_handler(InvalidGameAction)
async def invalid_action_handler(request, exc):
    logger.warning(f"Invalid action: {exc}")
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid action", "detail": str(exc)}
    )


@app.exception_handler(GeminiAPIError)
async def gemini_api_error_handler(request, exc):
    logger.error(f"Gemini API error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"error": "AI service unavailable", "detail": str(exc)}
    )


@app.exception_handler(TextWorldError)
async def textworld_error_handler(request, exc):
    logger.error(f"TextWorld error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Game engine error", "detail": str(exc)}
    )


# ヘルスチェックエンドポイント
@app.get("/healthz")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "gemini_api_configured": settings.gemini_api_key is not None
    }


# ルートエンドポイント
@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
        "health": "/healthz"
    }
```

---

### 1.4 .env.example

```env
# Gemini API設定
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=30

# アプリケーション設定
APP_NAME="TextWorld × LLM Adventure API"
DEBUG=true
LOG_LEVEL=INFO

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# セッション設定
SESSION_TIMEOUT=3600
MAX_SESSIONS=100

# TextWorld設定
GAMES_DIRECTORY=games
DEFAULT_MAX_STEPS=100
```

---

## Phase 2: TextWorld統合

### 2.1 models/game.py

```python
from typing import List, Optional
from pydantic import BaseModel, Field


class GameState(BaseModel):
    """ゲーム状態"""
    session_id: str = Field(..., description="セッションID")
    observation: str = Field(..., description="現在の観察結果")
    available_actions: List[str] = Field(..., description="利用可能なアクション")
    score: int = Field(default=0, description="現在のスコア")
    reward: Optional[int] = Field(None, description="最後のアクションの報酬")
    done: bool = Field(default=False, description="ゲーム終了フラグ")
    max_steps: int = Field(default=100, description="最大ステップ数")
    current_step: int = Field(default=0, description="現在のステップ数")


class GameStep(BaseModel):
    """ゲームステップの履歴"""
    step_number: int
    action: str
    observation: str
    reward: int
    score: int
    done: bool


class GameSession(BaseModel):
    """ゲームセッション"""
    session_id: str
    game_id: str
    created_at: str
    last_accessed: str
    current_step: int = 0
    history: List[GameStep] = []
    
    class Config:
        arbitrary_types_allowed = True
```

---

### 2.2 models/requests.py

```python
from typing import List, Optional
from pydantic import BaseModel, Field


class ResetRequest(BaseModel):
    """ゲームリセットリクエスト"""
    game_id: str = Field(..., description="ゲームID", example="simple_game")


class StepRequest(BaseModel):
    """アクション実行リクエスト"""
    session_id: str = Field(..., description="セッションID")
    action: str = Field(..., description="実行するアクション", example="go north")


class SuggestActionRequest(BaseModel):
    """AI推奨アクションリクエスト"""
    session_id: str = Field(..., description="セッションID")
    observation: str = Field(..., description="現在の観察結果")
    available_actions: List[str] = Field(..., description="利用可能なアクション")
    score: int = Field(default=0, description="現在のスコア")
    user_instruction: Optional[str] = Field(None, description="ユーザーからの指示")


class ActionSuggestion(BaseModel):
    """AI推奨アクションレスポンス"""
    suggested_action: str = Field(..., description="推奨されるアクション")
    reasoning: Optional[str] = Field(None, description="推奨理由")
    is_fallback: bool = Field(default=False, description="フォールバック使用フラグ")
```

---

### 2.3 core/exceptions.py

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


class GameNotFoundError(Exception):
    """ゲームファイルが見つからない"""
    pass
```

---

### 2.4 core/session_manager.py

```python
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from app.core.exceptions import GameSessionNotFound
from app.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """セッション管理クラス（シングルトン）"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._sessions: Dict[str, Dict[str, Any]] = {}
        return cls._instance
    
    def create_session(self, game_id: str) -> str:
        """新規セッションを作成"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        
        self._sessions[session_id] = {
            "session_id": session_id,
            "game_id": game_id,
            "created_at": now,
            "last_accessed": now,
            "game_env": None,  # TextWorldのゲーム環境
            "game_state": None,  # 現在のゲーム状態
            "current_step": 0,
            "history": []
        }
        
        logger.info(f"Session created: {session_id} for game: {game_id}")
        
        # セッション数制限チェック
        if len(self._sessions) > settings.max_sessions:
            self.cleanup_old_sessions()
        
        return session_id
    
    def get_session(self, session_id: str) -> Dict[str, Any]:
        """セッションを取得"""
        if session_id not in self._sessions:
            raise GameSessionNotFound(f"Session {session_id} not found")
        
        # 最終アクセス時刻を更新
        self._sessions[session_id]["last_accessed"] = datetime.now()
        
        return self._sessions[session_id]
    
    def update_session(self, session_id: str, **kwargs):
        """セッションを更新"""
        session = self.get_session(session_id)
        session.update(kwargs)
    
    def delete_session(self, session_id: str):
        """セッションを削除"""
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"Session deleted: {session_id}")
    
    def cleanup_old_sessions(self):
        """古いセッションをクリーンアップ"""
        timeout = timedelta(seconds=settings.session_timeout)
        now = datetime.now()
        
        to_delete = []
        for session_id, session in self._sessions.items():
            if now - session["last_accessed"] > timeout:
                to_delete.append(session_id)
        
        for session_id in to_delete:
            self.delete_session(session_id)
        
        if to_delete:
            logger.info(f"Cleaned up {len(to_delete)} old sessions")
    
    def get_all_sessions(self) -> Dict[str, Dict[str, Any]]:
        """全セッションを取得（デバッグ用）"""
        return self._sessions


# シングルトンインスタンス
session_manager = SessionManager()
```

---

### 2.5 services/textworld_service.py

```python
import os
import logging
import textworld
from typing import List, Dict, Any, Optional

from app.config import settings
from app.core.exceptions import TextWorldError, GameNotFoundError
from app.core.session_manager import session_manager
from app.models.game import GameState

logger = logging.getLogger(__name__)


class TextWorldService:
    """TextWorldゲームエンジンサービス"""
    
    def __init__(self):
        self.games_dir = settings.games_directory
    
    def _get_game_path(self, game_id: str) -> str:
        """ゲームファイルパスを取得"""
        # 複数の拡張子を試す
        extensions = [".z8", ".ulx", ".zblorb"]
        
        for ext in extensions:
            game_path = os.path.join(self.games_dir, f"{game_id}{ext}")
            if os.path.exists(game_path):
                return game_path
        
        raise GameNotFoundError(f"Game file not found for game_id: {game_id}")
    
    def initialize_game(self, session_id: str, game_id: str) -> GameState:
        """ゲームを初期化"""
        try:
            game_path = self._get_game_path(game_id)
            
            # TextWorld環境を作成
            env = textworld.start(game_path)
            game_state_tw = env.reset()
            
            # セッションに保存
            session_manager.update_session(
                session_id,
                game_env=env,
                game_state=game_state_tw,
                current_step=0
            )
            
            # GameStateに変換
            state = self._convert_to_game_state(
                session_id=session_id,
                game_state_tw=game_state_tw,
                current_step=0
            )
            
            logger.info(f"Game initialized: {game_id} for session: {session_id}")
            
            return state
            
        except Exception as e:
            logger.error(f"Failed to initialize game: {e}", exc_info=True)
            raise TextWorldError(f"Failed to initialize game: {str(e)}")
    
    def execute_action(self, session_id: str, action: str) -> GameState:
        """アクションを実行"""
        try:
            session = session_manager.get_session(session_id)
            env = session["game_env"]
            current_step = session["current_step"]
            
            if env is None:
                raise TextWorldError("Game environment not initialized")
            
            # アクションを実行
            game_state_tw, reward, done = env.step(action)
            
            # ステップをインクリメント
            current_step += 1
            
            # セッションを更新
            session_manager.update_session(
                session_id,
                game_state=game_state_tw,
                current_step=current_step
            )
            
            # GameStateに変換
            state = self._convert_to_game_state(
                session_id=session_id,
                game_state_tw=game_state_tw,
                current_step=current_step,
                reward=reward,
                done=done
            )
            
            logger.debug(f"Action executed: {action} -> Reward: {reward}, Done: {done}")
            
            return state
            
        except Exception as e:
            logger.error(f"Failed to execute action: {e}", exc_info=True)
            raise TextWorldError(f"Failed to execute action: {str(e)}")
    
    def _convert_to_game_state(
        self,
        session_id: str,
        game_state_tw: Dict[str, Any],
        current_step: int,
        reward: Optional[int] = None,
        done: bool = False
    ) -> GameState:
        """TextWorldの状態をGameStateに変換"""
        
        # 観察結果を取得
        observation = game_state_tw.get("feedback", game_state_tw.get("description", ""))
        
        # 利用可能なアクションを取得
        available_actions = game_state_tw.get("admissible_commands", [])
        
        # スコアを取得
        score = game_state_tw.get("score", 0)
        
        return GameState(
            session_id=session_id,
            observation=observation,
            available_actions=available_actions,
            score=score,
            reward=reward,
            done=done,
            max_steps=settings.default_max_steps,
            current_step=current_step
        )


# シングルトンインスタンス
textworld_service = TextWorldService()
```

---

### 2.6 api/game.py

```python
import logging
from fastapi import APIRouter, HTTPException

from app.models.requests import ResetRequest, StepRequest
from app.models.game import GameState
from app.services.textworld_service import textworld_service
from app.core.session_manager import session_manager
from app.core.exceptions import GameSessionNotFound, TextWorldError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/reset", response_model=GameState)
async def reset_game(request: ResetRequest):
    """
    新規ゲームセッションを作成し、初期状態を返す
    """
    try:
        # セッションを作成
        session_id = session_manager.create_session(request.game_id)
        
        # ゲームを初期化
        game_state = textworld_service.initialize_game(session_id, request.game_id)
        
        return game_state
        
    except Exception as e:
        logger.error(f"Failed to reset game: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/step", response_model=GameState)
async def step_game(request: StepRequest):
    """
    指定されたアクションを実行し、結果を返す
    """
    try:
        # アクションを実行
        game_state = textworld_service.execute_action(
            request.session_id,
            request.action
        )
        
        return game_state
        
    except GameSessionNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except TextWorldError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Phase 3: Gemini AI統合

### 3.1 services/gemini_service.py

```python
import logging
import random
from typing import List, Optional
import google.generativeai as genai

from app.config import settings
from app.models.requests import ActionSuggestion
from app.core.exceptions import GeminiAPIError

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AIサービス"""
    
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        self.timeout = settings.gemini_timeout
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logger.info(f"Gemini AI initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
                self.model = None
        else:
            self.model = None
            logger.warning("Gemini API key not configured")
    
    async def suggest_action(
        self,
        observation: str,
        available_actions: List[str],
        score: int,
        user_instruction: Optional[str] = None
    ) -> ActionSuggestion:
        """AI推奨アクションを取得"""
        
        # APIが利用できない場合はフォールバック
        if not self.model:
            return self._fallback_action(available_actions)
        
        try:
            # プロンプトを構築
            prompt = self._build_prompt(
                observation,
                available_actions,
                score,
                user_instruction
            )
            
            # Gemini APIを呼び出し
            response = self.model.generate_content(prompt)
            
            # レスポンスをパース
            suggested_action = self._parse_response(
                response.text,
                available_actions
            )
            
            logger.info(f"AI suggested action: {suggested_action}")
            
            return ActionSuggestion(
                suggested_action=suggested_action,
                reasoning=f"AI analysis: {response.text[:100]}...",
                is_fallback=False
            )
            
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}, using fallback")
            return self._fallback_action(available_actions)
    
    def _build_prompt(
        self,
        observation: str,
        available_actions: List[str],
        score: int,
        user_instruction: Optional[str] = None
    ) -> str:
        """プロンプトを構築"""
        
        actions_list = "\n".join([f"- {action}" for action in available_actions])
        
        prompt = f"""あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を1つ選択してください。

【現在の状況】
{observation}

【利用可能なアクション】
{actions_list}

【現在のスコア】
{score}
"""
        
        if user_instruction:
            prompt += f"\n【プレイヤーの指示】\n{user_instruction}\n"
        
        prompt += """
【目標】
ゲームをクリアすることです。状況を分析し、利用可能なアクションの中から最適なものを1つ選んでください。

選択するアクション（利用可能なアクションリストから正確に1つ選んでください）:
"""
        
        return prompt
    
    def _parse_response(
        self,
        response_text: str,
        available_actions: List[str]
    ) -> str:
        """レスポンスをパースしてアクションを抽出"""
        
        response_lower = response_text.lower().strip()
        
        # 利用可能なアクションと照合
        for action in available_actions:
            if action.lower() in response_lower:
                return action
        
        # 完全一致が見つからない場合、部分一致を試す
        for action in available_actions:
            action_words = action.lower().split()
            if any(word in response_lower for word in action_words):
                return action
        
        # それでも見つからない場合はランダム選択
        logger.warning(f"Could not parse action from response: {response_text}")
        return random.choice(available_actions)
    
    def _fallback_action(self, available_actions: List[str]) -> ActionSuggestion:
        """フォールバックアクション（ランダム選択）"""
        action = random.choice(available_actions)
        
        logger.info(f"Using fallback action: {action}")
        
        return ActionSuggestion(
            suggested_action=action,
            reasoning="Gemini API unavailable, random action selected",
            is_fallback=True
        )


# シングルトンインスタンス
gemini_service = GeminiService()
```

---

### 3.2 api/ai.py

```python
import logging
from fastapi import APIRouter, HTTPException

from app.models.requests import SuggestActionRequest, ActionSuggestion
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/suggest-action", response_model=ActionSuggestion)
async def suggest_action(request: SuggestActionRequest):
    """
    Gemini AIに推奨アクションを提案させる
    """
    try:
        suggestion = await gemini_service.suggest_action(
            observation=request.observation,
            available_actions=request.available_actions,
            score=request.score,
            user_instruction=request.user_instruction
        )
        
        return suggestion
        
    except Exception as e:
        logger.error(f"Failed to suggest action: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
```

---

## ディレクトリ初期化スクリプト

実装を開始する前に、以下のスクリプトで初期構造を作成できます：

### setup_backend.sh

```bash
#!/bin/bash

# ディレクトリ作成
mkdir -p app/{api,models,services,core}
mkdir -p games
mkdir -p tests

# __init__.pyファイル作成
touch app/__init__.py
touch app/api/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
touch app/core/__init__.py
touch tests/__init__.py

# 空ファイル作成
touch app/main.py
touch app/config.py
touch app/models/game.py
touch app/models/requests.py
touch app/services/textworld_service.py
touch app/services/gemini_service.py
touch app/core/session_manager.py
touch app/core/exceptions.py
touch app/api/game.py
touch app/api/ai.py

echo "Backend structure created successfully!"
```

---

## 次のステップ

1. Phase 1の実装から開始
2. 各Phaseごとに動作確認
3. Swagger UI (`http://localhost:8000/docs`) でテスト
4. フロントエンドとの連携確認

開発を開始する際は：

```bash
cd backend
chmod +x setup_backend.sh
./setup_backend.sh
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

