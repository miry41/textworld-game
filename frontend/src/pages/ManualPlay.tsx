import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { GameLog as GameLogType, AI_AGENT_STATES } from '@/types/game.ts';
import { apiClient } from '@/lib/api-client.ts';
import AAAgent from '@/components/AAAgent.tsx';
import GameLog from '@/components/GameLog.tsx';
import GameStatus from '@/components/GameStatus.tsx';
import PixelButton from '@/components/PixelButton.tsx';

export default function ManualPlay() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<GameLogType[]>([]);
  const [userInput, setUserInput] = useState('');
  const [agentState, setAgentState] = useState<keyof typeof AI_AGENT_STATES>('idle');
  const [lastAction, setLastAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [thinkingLogs, setThinkingLogs] = useState<Array<{
    id: string;
    timestamp: number;
    message: string;
    type: 'thinking' | 'action' | 'result' | 'observation';
  }>>([]);

  useEffect(() => {
    const selectedGame = sessionStorage.getItem('selectedGame');
    if (!selectedGame) {
      navigate('/');
      return;
    }

    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      console.log('Initializing game...');
      
      setThinkingLogs([
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: 'ゲームを初期化しています...',
          type: 'observation',
        },
      ]);

      const response = await apiClient.createSession();
      console.log('Session created:', response);
      console.log('Current session ID:', apiClient.getCurrentSessionId());
      
      const initialLog: GameLogType = {
        id: crypto.randomUUID(),
        action: 'START',
        observation: response.observation,
        score: response.score,
        reward: 0,
        done: false,
        timestamp: Date.now(),
        available_actions: response.available_actions,
      };
      setLogs([initialLog]);
      setSessionInitialized(true);

      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: 'ゲーム初期化完了！指示を入力してください。',
          type: 'result',
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setAgentState('error');
      setSessionInitialized(false);
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: 'エラー: ゲームの初期化に失敗しました',
          type: 'result',
        },
      ]);
    }
  };

  const handleReset = async () => {
    setLogs([]);
    setUserInput('');
    setAgentState('idle');
    setLastAction('');
    setIsProcessing(false);
    setIsDone(false);
    setSessionInitialized(false);
    setThinkingLogs([]);
    await initializeGame();
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || isProcessing || isDone || !sessionInitialized) return;

    const input = userInput.trim();
    setUserInput('');
    setIsProcessing(true);
    setAgentState('thinking');

    try {
      // 現在のゲーム状態を取得
      const currentLog = logs[logs.length - 1];
      const currentObservation = currentLog?.observation || '';
      const currentActions = currentLog?.available_actions || [];
      const currentScore = currentLog?.score || 0;

      // 指示受付ログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `プレイヤーの指示: ${input}`,
          type: 'observation',
        },
      ]);

      // Gemini APIを使用してアクションを提案してもらう
      const geminiResponse = await apiClient.getGeminiSuggestedAction(
        currentObservation,
        currentActions,
        currentScore,
        input  // ユーザーの指示を送信
      );

      const action = geminiResponse.suggested_action;
      setLastAction(action);

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

      // 行動ログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `選択した行動: ${action}`,
          type: 'action',
        },
      ]);

      const response = await apiClient.executeAction(action);

      // 結果ログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `実行完了！ スコア: ${response.score} (報酬: ${response.reward > 0 ? '+' : ''}${response.reward})`,
          type: 'result',
        },
      ]);

      const newLog: GameLogType = {
        id: crypto.randomUUID(),
        action,
        observation: response.observation,
        score: response.score,
        reward: response.reward,
        done: response.done,
        timestamp: Date.now(),
        available_actions: response.available_actions,
      };

      setLogs((prev) => [...prev, newLog]);
      setAgentState('success');
      setIsDone(response.done);

      setTimeout(() => {
        if (!response.done) {
          setAgentState('idle');
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to execute action:', error);
      setAgentState('error');
      setTimeout(() => setAgentState('idle'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const mapUserInputToAction = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('北') || lowerInput.includes('north')) return 'go north';
    if (lowerInput.includes('南') || lowerInput.includes('south')) return 'go south';
    if (lowerInput.includes('東') || lowerInput.includes('east')) return 'go east';
    if (lowerInput.includes('西') || lowerInput.includes('west')) return 'go west';
    if (lowerInput.includes('開け') || lowerInput.includes('open')) return 'open door';
    if (lowerInput.includes('閉め') || lowerInput.includes('close')) return 'close door';
    if (lowerInput.includes('鍵') && lowerInput.includes('探')) return 'examine room';
    if (lowerInput.includes('調べ') || lowerInput.includes('examine')) return 'examine room';
    if (lowerInput.includes('拾') || lowerInput.includes('take')) return 'take key';
    if (lowerInput.includes('インベントリ') || lowerInput.includes('inventory')) return 'inventory';

    return input;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setUserInput('');
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const currentStep = logs.length;
  const currentScore = logs.length > 0 ? logs[logs.length - 1].score : 0;

  return (
    <div className="dark">
      <div className="h-screen bg-background crt-screen flex flex-col">
        <header className="border-b border-border bg-card flex-shrink-0">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-primary terminal-text">
                手動モード
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm space-x-4">
                <span className="text-muted-foreground">
                  ターン: <span className="text-primary font-bold">{currentStep}</span>
                </span>
                <span className="text-muted-foreground">
                  スコア: <span className="text-secondary font-bold">{currentScore}</span>
                </span>
                {isDone && (
                  <span className="text-secondary font-bold">完了!</span>
                )}
              </div>
              <PixelButton onClick={handleReset} size="sm">
                <RotateCcw className="w-4 h-4 inline mr-1" />
                RESET
              </PixelButton>
            </div>
          </div>
        </header>

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="flex-1 pixel-border bg-card overflow-hidden">
            <GameLog logs={logs} />
          </div>

          <div className="w-96 flex flex-col gap-4">
            <div className="flex-1 overflow-hidden">
              <AAAgent
                state={agentState}
                userInput={agentState === 'thinking' ? userInput : undefined}
                lastAction={agentState === 'success' ? lastAction : undefined}
                thinkingLogs={thinkingLogs}
              />
            </div>

            <div className="flex-shrink-0">
              <GameStatus
                logs={logs}
                isActive={sessionInitialized && !isDone}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>

        <footer className="border-t border-border bg-card flex-shrink-0 p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing || isDone || !sessionInitialized}
                placeholder="短文で指示してください（例：鍵を探して、ドアを開けて）"
                maxLength={200}
                rows={2}
                className="w-full bg-input text-foreground border border-border rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {userInput.length}/200
              </div>
            </div>
            <PixelButton
              onClick={handleSubmit}
              disabled={!userInput.trim() || isProcessing || isDone || !sessionInitialized}
            >
              送信
            </PixelButton>
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Enter: 送信 | Shift+Enter: 改行 | Esc: クリア | Ctrl+L: フォーカス
          </div>
        </footer>
      </div>
    </div>
  );
}
