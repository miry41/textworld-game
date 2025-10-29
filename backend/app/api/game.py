import logging
from fastapi import APIRouter, HTTPException

from app.models.requests import ResetRequest, StepRequest
from app.models.game import GameState
from app.services.textworld_service import textworld_service
from app.core.session_manager import session_manager
from app.core.exceptions import GameSessionNotFound, TextWorldError, GameNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/reset", response_model=GameState)
async def reset_game(request: ResetRequest):
    """
    新規ゲームセッションを作成し、初期状態を返す
    
    Args:
        request: ゲームリセットリクエスト（game_id）
    
    Returns:
        GameState: 初期ゲーム状態
    """
    try:
        # セッションを作成
        session_id = session_manager.create_session(request.game_id)
        
        # ゲームを初期化
        game_state = textworld_service.initialize_game(session_id, request.game_id)
        
        logger.info(f"Game reset successful: {request.game_id}, session: {session_id}")
        
        return game_state
        
    except GameNotFoundError as e:
        logger.error(f"Game not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except TextWorldError as e:
        logger.error(f"TextWorld error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to reset game: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/step", response_model=GameState)
async def step_game(request: StepRequest):
    """
    指定されたアクションを実行し、結果を返す
    
    Args:
        request: アクション実行リクエスト（session_id, action）
    
    Returns:
        GameState: アクション実行後のゲーム状態
    """
    try:
        # アクションを実行
        game_state = textworld_service.execute_action(
            request.session_id,
            request.action
        )
        
        logger.info(f"Action executed: {request.action} in session: {request.session_id}")
        
        return game_state
        
    except GameSessionNotFound as e:
        logger.error(f"Session not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except TextWorldError as e:
        logger.error(f"TextWorld error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to execute action: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
