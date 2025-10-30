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
@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "gemini_api_configured": settings.gemini_api_key is not None
    }

# 互換性のために /healthz も追加
@app.get("/healthz")
async def healthz_check():
    """ヘルスチェック（互換性のため）"""
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
        "health": "/health"
    }

