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

