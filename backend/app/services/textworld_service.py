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
            
            # TextWorld環境を作成（admissible_commandsを有効化）
            request_infos = textworld.EnvInfos(
                description=True,
                inventory=True,
                admissible_commands=True,
                won=True,
                lost=True
            )
            env = textworld.start(game_path, request_infos=request_infos)
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
            previous_game_state = session.get("game_state")
            
            if env is None:
                raise TextWorldError("Game environment not initialized")
            
            # 前のスコアを取得
            previous_score = previous_game_state.get("score", 0) if previous_game_state else 0
            
            # アクションを実行
            game_state_tw, tw_reward, done = env.step(action)
            
            # 現在のスコアを取得
            current_score = game_state_tw.get("score", 0)
            
            # 報酬は前のスコアとの差分として計算
            reward = current_score - previous_score
            
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
            
            logger.debug(f"Action executed: {action} -> Score: {current_score}, Reward: {reward}, Done: {done}")
            
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
        
        # ゲーム終了判定（won/lostも確認）
        if not done:
            done = game_state_tw.get("won", False) or game_state_tw.get("lost", False)
        
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

