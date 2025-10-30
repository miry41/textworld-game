# Gemini AI プロンプト仕様

このドキュメントでは、TextWorldゲームでGemini AIに送信されるプロンプトの構造と、各変数の意味について説明します。

## 📝 プロンプトの構造

Gemini AIには、以下の構造でプロンプトが送信されます：

```
あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を1つ選択してください。

【現在の状況】
{observation}

【利用可能なアクション】
{actions_list}

【現在のスコア】
{score}

[【プレイヤーの指示】（オプション）]
{user_instruction}

【目標】
ゲームをクリアすることです。状況を分析し、利用可能なアクションの中から最適なものを1つ選んでください。

【回答形式】
以下の形式で回答してください：

思考過程: （状況分析と判断理由を2-3文で説明）
選択: （利用可能なアクションから1つ選択）

例：
思考過程: 部屋には鍵があり、北にドアがある。まず鍵を取得してからドアを開けるのが効率的だ。
選択: take key
```

## 🔤 変数の説明

### 1. `observation` (観察結果)

**説明**: TextWorldゲームエンジンが返す、現在の状況説明テキスト

**データソース**: 
```python
game_state_tw.get("feedback", game_state_tw.get("description", ""))
```

**例**:
```
You are in a small room. There is a wooden door to the north and a key on the table.
The room is dimly lit by a single candle.
```

**用途**: AIにゲームの現在の状況を理解させるための情報

---

### 2. `available_actions` (利用可能なアクション)

**説明**: ゲームで実行可能なコマンドのリスト

**データソース**:
```python
game_state_tw.get("admissible_commands", [])
```

**例**:
```python
[
  "go north",
  "take key",
  "examine table",
  "examine door",
  "look around"
]
```

**プロンプト内での表示**:
```
- go north
- take key
- examine table
- examine door
- look around
```

**用途**: AIが選択できる行動の範囲を明確に制限し、有効なアクションのみを選ばせる

---

### 3. `score` (スコア)

**説明**: 現在のゲームスコア（数値）

**データソース**:
```python
game_state_tw.get("score", 0)
```

**例**:
```
0, 5, 10, 15...
```

**用途**: AIにゲームの進捗状況を伝え、スコアを上げる行動を優先させる

---

### 4. `user_instruction` (プレイヤーの指示) ⚠️ オプション

**説明**: プレイヤーが入力した指示（Manualモードのみ）

**データソース**: フロントエンドから送信される

**例**:
```
"鍵を探してください"
"北に進んで"
"宝箱を開けて"
```

**モード別の動作**:
- **Manualモード**: プレイヤーが入力した指示がそのまま送信される
- **Autoモード**: `None` (送信されない、プロンプトから除外される)

**用途**: AIにプレイヤーの意図を伝え、指示に沿った行動を選ばせる

---

## 🔄 データの流れ

```
┌─────────────────────────┐
│ TextWorld ゲームエンジン │
└───────────┬─────────────┘
            │ ゲーム状態を取得
            ↓
┌─────────────────────────────────────┐
│ textworld_service.py                 │
│ ・observation = feedback/description │
│ ・available_actions = admissible_cmds│
│ ・score = score                      │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────┐      ┌──────────────────┐
│ Frontend (React)        │      │ Manual モード時   │
│ ・AutoPlay.tsx         │ or   │ ・user_instruction│
│ ・ManualPlay.tsx       │      └────────┬─────────┘
└───────────┬─────────────┘              │
            │                             │
            └──────────────┬──────────────┘
                           ↓
            ┌──────────────────────────┐
            │ POST /gemini/suggest-action│
            └──────────────┬──────────────┘
                           ↓
            ┌──────────────────────────┐
            │ ai.py (API エンドポイント)│
            │ リクエストを受け取る      │
            └──────────────┬───────────┘
                           ↓
            ┌──────────────────────────────┐
            │ gemini_service.py             │
            │ suggest_action()              │
            │   ↓                           │
            │ _build_prompt()               │
            │ プロンプトを構築              │
            └──────────────┬───────────────┘
                           ↓
            ┌──────────────────────────┐
            │ Gemini API (gemini-2.5-flash)│
            │ プロンプトを送信          │
            └──────────────┬───────────┘
                           ↓
            ┌──────────────────────────┐
            │ レスポンス                │
            │ "take key"                │
            └──────────────────────────┘
```

## 🎮 モード別の違い

### Manualモード (手動プレイ)

**プロンプトに含まれる情報**:
- ✅ 現在の状況 (observation)
- ✅ 利用可能なアクション (available_actions)
- ✅ 現在のスコア (score)
- ✅ **プレイヤーの指示 (user_instruction)**

**例**:
```
【プレイヤーの指示】
鍵を探してください
```

**コード**:
```typescript
// ManualPlay.tsx
const response = await apiClient.getGeminiSuggestedAction(
  observation,
  availableActions,
  score,
  userInput  // ← ユーザー入力を送信
);
```

---

### Autoモード (自動プレイ)

**プロンプトに含まれる情報**:
- ✅ 現在の状況 (observation)
- ✅ 利用可能なアクション (available_actions)
- ✅ 現在のスコア (score)
- ❌ プレイヤーの指示 (なし)

**コード**:
```typescript
// AutoPlay.tsx
const geminiResponse = await apiClient.getGeminiSuggestedAction(
  currentObservation,
  currentActions,
  currentScore
  // user_instruction は送信しない
);
```

---

## 🧠 プロンプトの設計意図

### 1. **役割の明確化**
```
あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
```
→ AIに「ゲームのエキスパート」という役割を与え、適切な判断を促す

### 2. **構造化された情報提供**
各セクションを明確に分けることで、AIが情報を整理しやすくする：
- 現在の状況（what）
- 選択肢（options）
- 目標（goal）
- 制約（format）

### 3. **厳密な回答形式の指定**
```
選択したアクションだけを1行で答えてください。
利用可能なアクションリストから正確に選んでください。
```
→ AIが余計な説明を加えず、リストから正確にアクションを選ぶよう制約

### 4. **オプションの柔軟性**
`user_instruction` をオプションにすることで：
- Manualモード: プレイヤーの意図を反映
- Autoモード: AIが自律的に判断

---

## 📄 関連ファイル

### バックエンド
- **`backend/app/services/gemini_service.py`** - プロンプト構築ロジック
- **`backend/app/services/textworld_service.py`** - ゲーム状態の取得
- **`backend/app/api/ai.py`** - APIエンドポイント
- **`backend/app/models/requests.py`** - リクエスト/レスポンスモデル
- **`backend/app/config.py`** - Gemini API設定

### フロントエンド
- **`frontend/src/pages/AutoPlay.tsx`** - 自動プレイモード
- **`frontend/src/pages/ManualPlay.tsx`** - 手動プレイモード
- **`frontend/src/lib/api-client.ts`** - APIクライアント

---

## ⚙️ 設定

### 使用モデル
```python
# backend/app/config.py
gemini_model: str = "gemini-2.5-flash"
gemini_timeout: int = 30  # 秒
```

### API設定
```bash
# backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🔧 カスタマイズ

プロンプトをカスタマイズする場合は、`backend/app/services/gemini_service.py` の `_build_prompt()` メソッドを編集してください。

**例: ヒントを追加する**
```python
prompt = f"""あなたはテキストアドベンチャーゲームのエキスパートプレイヤーです。
現在の状況と利用可能なアクションから、最適な行動を1つ選択してください。

【ヒント】
・未探索の場所を優先的に探索してください
・アイテムは取得できるときに取得してください

【現在の状況】
{observation}
...
"""
```

---

## 📊 レスポンス処理

### 成功時
```python
ActionSuggestion(
    suggested_action="take key",
    reasoning="部屋には鍵があり、北にドアがある。まず鍵を取得してからドアを開けるのが効率的だ。",
    is_fallback=False
)
```

Gemini APIからのレスポンスは以下の形式で返されます：

```
思考過程: 部屋には鍵があり、北にドアがある。まず鍵を取得してからドアを開けるのが効率的だ。
選択: take key
```

このレスポンスは`_parse_response()`メソッドでパースされ、以下のように分離されます：
- **思考過程** → `reasoning` フィールド
- **選択されたアクション** → `suggested_action` フィールド

### フォールバック時（API障害）
```python
ActionSuggestion(
    suggested_action="go north",  # ランダム選択
    reasoning="Gemini API unavailable, random action selected",
    is_fallback=True
)
```

---

## 🐛 トラブルシューティング

### プロンプトの確認方法

バックエンドログで確認できます：
```bash
# ログレベルをDEBUGに設定
LOG_LEVEL=DEBUG

# ログに出力される
logger.debug(f"AI reasoning: {response.text[:200]}")
```

### よくある問題

**1. AIが無効なアクションを返す**
→ `_parse_response()` で部分一致による修正を試みます

**2. API呼び出しが失敗する**
→ 自動的にランダムアクションにフォールバックします

**3. タイムアウトする**
→ `gemini_timeout` 設定を調整してください

---

## ✨ 思考過程の表示機能

### 概要

AIエージェントの思考過程を明示的に表示する機能が実装されています。この機能により、AIがどのように判断しているかをリアルタイムで確認できます。

### 実装方法

#### 1. プロンプトの改善

新しいプロンプトでは、AIに**思考過程**と**選択したアクション**を明示的に分けて出力させます：

```
思考過程: （状況分析と判断理由を2-3文で説明）
選択: （利用可能なアクションから1つ選択）
```

#### 2. レスポンスのパース

`_parse_response()`メソッドで以下のように処理されます：

1. **思考過程の抽出**: 「思考過程:」または「reasoning:」で始まる行を検索
2. **アクションの抽出**: 「選択:」または「action:」で始まる行を検索
3. **フォールバック**: パースに失敗した場合は、利用可能なアクションから部分一致で検索

```python
def _parse_response(
    self,
    response_text: str,
    available_actions: List[str]
) -> tuple[str, str]:  # (action, reasoning) を返す
    # ... パース処理 ...
    return selected_action, reasoning
```

#### 3. フロントエンドでの表示

**AutoPlayモード**: 右パネルの「AI思考ログ」に表示
- 💭 思考: 思考過程（黄色）
- ⚡ 行動: 選択したアクション（緑色）
- ✅ 結果: 実行結果（紫色）

**ManualPlayモード**: 同様に右パネルで表示
- 📋 観察: プレイヤーの指示（青色）
- 💭 思考: AIの思考過程（黄色）
- ⚡ 行動: 選択したアクション（緑色）
- ✅ 結果: 実行結果（紫色）

### コード例

**バックエンド（gemini_service.py）**:
```python
# 思考過程とアクションを分離して返す
suggested_action, reasoning = self._parse_response(
    response.text,
    available_actions
)

return ActionSuggestion(
    suggested_action=suggested_action,
    reasoning=reasoning,  # 思考過程
    is_fallback=False
)
```

**フロントエンド（AutoPlay.tsx / ManualPlay.tsx）**:
```typescript
// 思考過程ログを追加
if (geminiResponse.reasoning) {
  setThinkingLogs((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message: `💭 ${geminiResponse.reasoning}`,
      type: 'thinking',
    },
  ]);
}
```

### メリット

1. **透明性**: AIの判断理由が明確になる
2. **デバッグ**: AIが適切な判断をしているか確認できる
3. **学習**: AIの思考パターンを理解できる
4. **UX向上**: プレイヤーがAIの意図を理解しやすくなる

---

最終更新: 2025-10-29

