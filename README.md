# TextWorld × LLM Adventure

レトロスタイルのCRTモニター風UIを持つ、TextWorldゲームエンジンを使用したテキストアドベンチャーゲームアプリケーション。LLM（Gemini AI）と協力してゲームをクリアする体験を提供します。

## 特徴

- **レトロCRT風デザイン**: グリーンモノクロ、スキャンライン効果、ピクセルボーダー
- **AAエージェント**: 状態に応じて表情が変わるASCIIアートキャラクター
- **2つのプレイモード**:
  - 手動モード: 短文で指示を出し、AIが行動を決定
  - 自動モード: AIが自動でゲームを進行
- **リアルタイムゲームログ**: タイムスタンプ付きで全アクションを記録
- **キーボードショートカット**: 快適な操作体験

## 技術スタック

- **Vite** 5.4+ - 高速ビルドツール
- **React** 18.3+ - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS** 3.4+ - ユーティリティファーストCSS
- **React Router** 7.9+ - ルーティング
- **Lucide React** - アイコン

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 4. バックエンドの起動（必須）

このフロントエンドは、Python FastAPIバックエンドと連携する必要があります。

バックエンドディレクトリで:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

バックエンドの`.env`ファイルに以下を設定:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## プロジェクト構造

```
src/
├── main.tsx              # エントリーポイント
├── App.tsx               # ルーター設定
├── index.css             # グローバルスタイル（CRTエフェクト含む）
├── pages/
│   ├── Home.tsx          # ホーム画面
│   ├── ManualPlay.tsx    # 手動プレイモード
│   ├── AutoPlay.tsx      # 自動プレイモード
│   └── Instructions.tsx  # 操作説明
├── components/
│   ├── AAAgent.tsx       # AAエージェント表示
│   ├── GameLog.tsx       # ゲームログ表示
│   ├── GameStatus.tsx    # ゲームステータス表示
│   └── PixelButton.tsx   # ピクセルスタイルボタン
├── lib/
│   └── api-client.ts     # APIクライアント
└── types/
    └── game.ts           # 型定義
```

## 使い方

### 手動モード

1. ホーム画面でゲームとモードを選択
2. テキストエリアに短文で指示を入力（例: 「鍵を探して」「北に進んで」）
3. Enterキーで送信
4. AIが指示を解釈し、適切なアクションを実行

#### キーボードショートカット

- `Enter`: 送信
- `Shift + Enter`: 改行
- `Esc`: クリア
- `Ctrl + L`: 入力欄にフォーカス

### 自動モード

1. ホーム画面で自動モードを選択
2. NEXTボタンをクリックすると、AIが自動で次の行動を決定
3. Gemini APIが設定されていない場合は、ランダムアクションを使用

## ビルド

本番用ビルドを作成:

```bash
npm run build
```

ビルドされたファイルは`dist/`ディレクトリに出力されます。

プレビュー:

```bash
npm run preview
```

## API エンドポイント

フロントエンドは以下のAPIエンドポイントを使用します:

- `POST /reset` - ゲームセッション作成
- `POST /step` - アクション実行
- `POST /gemini/suggest-action` - AI推奨アクション取得
- `GET /healthz` - ヘルスチェック

## カスタマイズ

### カラーテーマ変更

`src/index.css`の`:root`セクションを編集:

```css
:root {
  --primary: 120 100% 85%;  /* グリーン */
  --secondary: 40 100% 70%; /* オレンジ */
}
```

### AAキャラクター変更

`src/components/AAAgent.tsx`の`getAACharacter()`関数を編集。

### ゲーム追加

`src/types/game.ts`の`GAMES`配列に追加:

```typescript
{
  id: 'new-game',
  name: 'New Adventure',
  difficulty: 'Hard',
  description: '新しい冒険の説明',
  maxSteps: 100,
}
```

## トラブルシューティング

### バックエンドに接続できない

- バックエンドが`http://localhost:8000`で起動しているか確認
- `.env`ファイルの`VITE_API_BASE_URL`が正しいか確認
- CORS設定がバックエンドで有効になっているか確認

### Gemini APIが動作しない

- バックエンドの`.env`に`GEMINI_API_KEY`が設定されているか確認
- APIキーが有効か確認
- 自動モードで警告メッセージが表示されている場合は、キーが未設定

## ライセンス

MIT

## 作者

TextWorld × LLM Adventure Project
