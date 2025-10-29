import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, User, Bot } from 'lucide-react';
import { GAMES } from '@/types/game.ts';
import PixelButton from '@/components/PixelButton.tsx';

export default function Home() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string>('treasure-hunt');
  const [selectedMode, setSelectedMode] = useState<'manual' | 'auto'>('manual');

  const handleStart = () => {
    sessionStorage.setItem('selectedGame', selectedGame);
    sessionStorage.setItem('selectedMode', selectedMode);
    navigate(`/play/${selectedMode}`);
  };

  return (
    <div className="dark">
      <div className="min-h-screen bg-background crt-screen">
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold text-primary terminal-text">
              TextWorld × LLM Adventure
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-primary terminal-text tracking-wider">
              ◆ ADVENTURE ◆
            </h2>
            <p className="text-lg text-muted-foreground">
              LLM と一緒にテキストアドベンチャーを楽しもう
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-primary">ゲームを選択</h3>
              <div className="grid gap-4">
                {GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`pixel-border bg-card p-4 text-left transition-all ${
                      selectedGame === game.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-bold text-primary">{game.name}</h4>
                      <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">
                        {game.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {game.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      最大ステップ数: {game.maxSteps}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-primary">操作モードを選択</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedMode('manual')}
                  className={`pixel-border bg-card p-6 text-left transition-all ${
                    selectedMode === 'manual' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-6 h-6 text-primary" />
                    <h4 className="text-base font-bold text-primary">手動モード</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    あなたが短文で指示を出し、LLM が行動を決定します
                  </p>
                </button>

                <button
                  onClick={() => setSelectedMode('auto')}
                  className={`pixel-border bg-card p-6 text-left transition-all ${
                    selectedMode === 'auto' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-6 h-6 text-primary" />
                    <h4 className="text-base font-bold text-primary">自動モード</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI が自動でゲームを進行します
                  </p>
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <PixelButton onClick={handleStart} size="lg">
                ゲーム開始
              </PixelButton>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/instructions')}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                操作説明を見る
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
