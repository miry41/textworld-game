import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Keyboard, User, Bot, Target } from 'lucide-react';
import PixelButton from '@/components/PixelButton';

export default function Instructions() {
  const navigate = useNavigate();

  return (
    <div className="dark">
      <div className="min-h-screen bg-background crt-screen">
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary terminal-text">
              操作説明
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          <div className="pixel-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-primary">ゲームの目的</h2>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              TextWorld は、テキストベースのアドベンチャーゲームです。
              プレイヤーは様々なアクションを実行して、ゲームの目標を達成します。
              LLM（大規模言語モデル）の力を借りて、自然な日本語の指示でゲームを進めることができます。
            </p>
          </div>

          <div className="pixel-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-primary">手動モード</h2>
            </div>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>画面下部のテキストエリアに短文で指示を入力します</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>例: 「鍵を探して」「ドアを開けて」「北に進んで」</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>AI が指示を理解し、適切なアクションを実行します</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>ゲームログで結果を確認できます</span>
              </li>
            </ul>
          </div>

          <div className="pixel-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-primary">自動モード</h2>
            </div>
            <ul className="space-y-2 text-foreground text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>NEXT ボタンをクリックすると、AI が自動で次の行動を決定します</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Gemini API が設定されている場合、より賢い判断が可能です</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>プログレスバーでゲームの進行状況を確認できます</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>リセットボタンでいつでもゲームをやり直せます</span>
              </li>
            </ul>
          </div>

          <div className="pixel-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <Keyboard className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-primary">キーボードショートカット</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-foreground text-sm">
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span>Enter</span>
                <span className="text-muted-foreground">送信</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span>Shift + Enter</span>
                <span className="text-muted-foreground">改行</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span>Esc</span>
                <span className="text-muted-foreground">クリア</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span>Ctrl + L</span>
                <span className="text-muted-foreground">フォーカス</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <PixelButton onClick={() => navigate('/')} size="lg">
              ホームに戻る
            </PixelButton>
          </div>
        </main>
      </div>
    </div>
  );
}
