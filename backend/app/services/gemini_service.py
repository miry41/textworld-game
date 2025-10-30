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
            
            # レスポンスをパース（思考過程とアクションを分離）
            suggested_action, reasoning = self._parse_response(
                response.text,
                available_actions
            )
            
            logger.info(f"AI suggested action: {suggested_action}")
            logger.debug(f"AI reasoning: {reasoning}")
            
            return ActionSuggestion(
                suggested_action=suggested_action,
                reasoning=reasoning,
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
        
        # プレイヤーの指示セクション（オプション）
        instruction_section = f"""
【プレイヤーの指示】
{user_instruction}
""" if user_instruction else ""
        
        # プロンプト全体を構築
        prompt = f"""あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を1つ選択してください。

【現在の状況】
{observation}

【利用可能なアクション】
{actions_list}

【現在のスコア】
{score}
{instruction_section}
【目標】
ゲームをクリアすることです。状況を分析し、利用可能なアクションの中から最適なものを1つ選んでください。

【回答形式】
以下の形式で回答してください：

思考過程: （状況分析と判断理由を2-3文で説明）
選択: （利用可能なアクションから1つ選択）

例：
思考過程: 部屋には鍵があり、北にドアがある。まず鍵を取得してからドアを開けるのが効率的だ。
選択: take key
"""
        
        return prompt
    
    def _parse_response(
        self,
        response_text: str,
        available_actions: List[str]
    ) -> tuple[str, str]:
        """レスポンスをパースして思考過程とアクションを抽出"""
        
        reasoning = ""
        selected_action = ""
        
        # "思考過程:"と"選択:"のパターンを探す
        lines = response_text.strip().split('\n')
        
        for line in lines:
            line_stripped = line.strip()
            
            # 思考過程を抽出
            if '思考過程:' in line_stripped or '思考過程：' in line_stripped:
                reasoning = line_stripped.split(':', 1)[-1].split('：', 1)[-1].strip()
            elif 'reasoning:' in line_stripped.lower():
                reasoning = line_stripped.split(':', 1)[-1].strip()
            
            # 選択されたアクションを抽出
            if '選択:' in line_stripped or '選択：' in line_stripped:
                selected_action = line_stripped.split(':', 1)[-1].split('：', 1)[-1].strip()
            elif 'action:' in line_stripped.lower() or 'selected:' in line_stripped.lower():
                selected_action = line_stripped.split(':', 1)[-1].strip()
        
        # アクションが見つからない場合、利用可能なアクションと照合
        if not selected_action:
            response_lower = response_text.lower()
            for action in available_actions:
                if action.lower() in response_lower:
                    selected_action = action
                    break
            
            # 完全一致が見つからない場合、部分一致を試す
            if not selected_action:
                for action in available_actions:
                    action_words = action.lower().split()
                    if any(word in response_lower for word in action_words):
                        selected_action = action
                        break
            
            # それでも見つからない場合はランダム選択
            if not selected_action:
                logger.warning(f"Could not parse action from response: {response_text}")
                selected_action = random.choice(available_actions)
                reasoning = "アクションの解析に失敗したため、ランダムに選択しました。"
        
        # 思考過程が抽出できなかった場合は、レスポンス全体を使用
        if not reasoning:
            reasoning = response_text[:200] if len(response_text) > 200 else response_text
        
        return selected_action, reasoning
    
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

