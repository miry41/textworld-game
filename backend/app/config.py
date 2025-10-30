from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


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
    frontend_url: Optional[str] = None
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173"
    ]
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v, info):
        """CORS originsをパース（環境変数からの読み込みに対応）"""
        # 既にリストの場合
        if isinstance(v, list):
            origins = v
        # カンマ区切りの文字列の場合
        elif isinstance(v, str):
            origins = [origin.strip() for origin in v.split(",")]
        else:
            origins = []
        
        # FRONTEND_URLが設定されている場合は追加
        frontend_url = info.data.get("frontend_url")
        if frontend_url and frontend_url not in origins:
            origins.append(frontend_url)
        
        return origins
    
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

