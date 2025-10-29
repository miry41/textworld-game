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

