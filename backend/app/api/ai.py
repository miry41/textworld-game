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
    
    Args:
        request: AI推奨アクションリクエスト
    
    Returns:
        ActionSuggestion: 推奨アクション、理由、フォールバックフラグ
    """
    try:
        suggestion = await gemini_service.suggest_action(
            observation=request.observation,
            available_actions=request.available_actions,
            score=request.score,
            user_instruction=request.user_instruction
        )
        
        logger.info(f"Action suggested for session: {request.session_id}")
        
        return suggestion
        
    except Exception as e:
        logger.error(f"Failed to suggest action: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

