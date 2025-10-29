import logging
import random
from typing import List, Optional
import google.generativeai as genai

from app.config import settings
from app.models.requests import ActionSuggestion
from app.core.exceptions import GeminiAPIError

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AIサービス"""
    
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        self.timeout = settings.gemini_timeout
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logger.info(f"Gemini AI initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
                self.model = None
        else:
            self.model = None
            logger.warning("Gemini API key not configured")
    
    async def suggest_action(
        self,
        observation: str,
        available_actions: List[str],
        score: int,
        user_instruction: Optional[str] = None
    ) -> ActionSuggestion:
        """AI推奨アクションを取得"""
        
        # APIが利用できない場合はフォールバック
        if not self.model:
            return self._fallback_action(available_actions)
        
        try:
            # プロンプトを構築
            prompt = self._build_prompt(
                observation,
                available_actions,
                score,
                user_instruction
            )
            
            # Gemini APIを呼び出し
            response = self.model.generate_content(prompt)
            
            # レスポンスをパース
            suggested_action = self._parse_response(
                response.text,
                available_actions
            )
            
            logger.info(f"AI suggested action: {suggested_action}")
            logger.debug(f"AI reasoning: {response.text[:200]}")
            
            return ActionSuggestion(
                suggested_action=suggested_action,
                reasoning=response.text[:200] if len(response.text) > 200 else response.text,
                is_fallback=False
            )
            
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}, using fallback")
            return self._fallback_action(available_actions)
    
    def _build_prompt(
        self,
        observation: str,
        available_actions: List[str],
        score: int,
        user_instruction: Optional[str] = None
    ) -> str:
        """プロンプトを構築"""
        
        actions_list = "\n".join([f"- {action}" for action in available_actions])
        
        prompt = f"""あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を1つ選択してください。

【現在の状況】
{observation}

【利用可能なアクション】
{actions_list}

【現在のスコア】
{score}
"""
        
        if user_instruction:
            prompt += f"\n【プレイヤーの指示】\n{user_instruction}\n"
        
        prompt += """
【目標】
ゲームをクリアすることです。状況を分析し、利用可能なアクションの中から最適なものを1つ選んでください。

【回答形式】
選択したアクションだけを1行で答えてください。利用可能なアクションリストから正確に選んでください。

選択するアクション:
"""
        
        return prompt
    
    def _parse_response(
        self,
        response_text: str,
        available_actions: List[str]
    ) -> str:
        """レスポンスをパースしてアクションを抽出"""
        
        response_lower = response_text.lower().strip()
        
        # 利用可能なアクションと照合
        for action in available_actions:
            if action.lower() in response_lower:
                return action
        
        # 完全一致が見つからない場合、部分一致を試す
        for action in available_actions:
            action_words = action.lower().split()
            if any(word in response_lower for word in action_words):
                return action
        
        # それでも見つからない場合はランダム選択
        logger.warning(f"Could not parse action from response: {response_text}")
        return random.choice(available_actions)
    
    def _fallback_action(self, available_actions: List[str]) -> ActionSuggestion:
        """フォールバックアクション（ランダム選択）"""
        action = random.choice(available_actions)
        
        logger.info(f"Using fallback action: {action}")
        
        return ActionSuggestion(
            suggested_action=action,
            reasoning="Gemini API unavailable, random action selected",
            is_fallback=True
        )


# シングルトンインスタンス
gemini_service = GeminiService()

