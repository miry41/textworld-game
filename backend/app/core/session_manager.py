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

