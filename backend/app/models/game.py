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

