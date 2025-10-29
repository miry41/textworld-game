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
        "http://localhost:3001",
        "http://localhost:5173"
    ]
    
    # セッション
    session_timeout: int = 3600  # 秒
    max_sessions: int = 100
    
    # TextWorld
    games_directory: str = "games"
    default_max_steps: int = 100
    
    class Config:
        # ルートディレクトリとbackendディレクトリの両方から.env.localを探す
        env_file = ("../.env.local", ".env.local", ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # 未定義の環境変数を無視


# シングルトンインスタンス
settings = Settings()

