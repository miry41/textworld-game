import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { GameLog as GameLogType, AI_AGENT_STATES } from '@/types/game.ts';
import { apiClient } from '@/lib/api-client.ts';
import AAAgent, { ThinkingLog } from '@/components/AAAgent.tsx';
import GameLog from '@/components/GameLog.tsx';
import PixelButton from '@/components/PixelButton.tsx';

export default function AutoPlay() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<GameLogType[]>([]);
  const [agentState, setAgentState] = useState<keyof typeof AI_AGENT_STATES>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
  const [maxSteps, setMaxSteps] = useState(50);
  const [panelWidth, setPanelWidth] = useState(320); // リサイズ可能なパネル幅
  const [isResizing, setIsResizing] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState<ThinkingLog[]>([]); // AI思考ログ

  useEffect(() => {
    const selectedGame = sessionStorage.getItem('selectedGame');
    if (!selectedGame) {
      navigate('/');
      return;
    }

    initializeGame();
  }, []);

  // リサイズ処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 16; // 16pxはpaddingの調整
      setPanelWidth(Math.max(256, Math.min(600, newWidth))); // 最小256px、最大600px
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const initializeGame = async () => {
    try {
      console.log('Initializing game...');
      
      // ヘルスチェックでGemini API状態を確認
      try {
        const health = await apiClient.healthCheck();
        setIsGeminiConfigured(health.gemini_api_configured || false);
        console.log('Gemini API configured:', health.gemini_api_configured);
      } catch (e) {
        console.warn('Health check failed:', e);
      }
      
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
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setAgentState('error');
      setSessionInitialized(false);
    }
  };

  const handleReset = async () => {
    setLogs([]);
    setThinkingLogs([]);
    setAgentState('idle');
    setIsProcessing(false);
    setIsDone(false);
    setSessionInitialized(false);
    await initializeGame();
  };

  const handleNext = async () => {
    if (isProcessing || isDone || !sessionInitialized) {
      console.log('handleNext blocked:', { isProcessing, isDone, sessionInitialized });
      return;
    }

    console.log('Current session ID before action:', apiClient.getCurrentSessionId());
    
    if (!apiClient.getCurrentSessionId()) {
      console.error('No session ID available, reinitializing...');
      await initializeGame();
      return;
    }

    setIsProcessing(true);
    setAgentState('auto');

    try {
      const lastLog = logs[logs.length - 1];
      const currentObservation = lastLog?.observation || '';
      const currentActions = lastLog?.available_actions || [];
      const currentScore = lastLog?.score || 0;

      // 観察ログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `現在の状況を確認しています... スコア: ${currentScore}, 選択肢: ${currentActions.length}個`,
          type: 'observation',
        },
      ]);

      console.log('Requesting Gemini suggestion with:', {
        observation: currentObservation.substring(0, 50) + '...',
        actionsCount: currentActions.length,
        score: currentScore
      });

      // 思考ログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: 'AIに最適な行動を問い合わせ中...',
          type: 'thinking',
        },
      ]);

      const geminiResponse = await apiClient.getGeminiSuggestedAction(
        currentObservation,
        currentActions,
        currentScore
      );
      console.log('Gemini response:', geminiResponse);
      setIsGeminiConfigured(!geminiResponse.is_fallback);

      const action = geminiResponse.suggested_action;

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
      setIsDone(response.done);

      if (response.max_steps) {
        setMaxSteps(response.max_steps);
      }

      setAgentState('idle');
    } catch (error) {
      console.error('Failed to execute auto action:', error);
      setAgentState('error');
      
      // エラーログを追加
      setThinkingLogs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
          type: 'result',
        },
      ]);
      
      setTimeout(() => setAgentState('idle'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStep = logs.length;
  const currentScore = logs.length > 0 ? logs[logs.length - 1].score : 0;
  const progress = Math.min((currentStep / maxSteps) * 100, 100);

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
                自動モード
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm space-x-4">
                <span className="text-muted-foreground">
                  ターン: <span className="text-primary font-bold">{currentStep}</span>
                </span>
                {/*<span className="text-muted-foreground">
                  スコア: <span className="text-secondary font-bold">{currentScore}</span>
                </span>*/}
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

        {/*
        <div className="flex-shrink-0 px-4 py-4">
          <div className="pixel-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">進捗</span>
              <span className="text-sm font-bold text-primary">
                {currentStep} / {maxSteps}
              </span>
            </div>
            <div className="h-4 bg-muted rounded overflow-hidden pixel-border">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                }}
              />
            </div>
            {isDone && (
              <div className="mt-2 text-center text-secondary font-bold">
                COMPLETE!
              </div>
            )}
          </div>
        </div>
        */}
        <div className="flex-shrink-0 px-4 py-4"></div>


        <div className="flex-1 flex px-4 pb-4 overflow-hidden">
          <div className="flex-1 pixel-border bg-card overflow-hidden">
            <GameLog logs={logs} />
          </div>

          {/* リサイズハンドル */}
          <div
            className="w-1 cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0 mx-2"
            onMouseDown={() => setIsResizing(true)}
            title="ドラッグでパネル幅を調整"
          />

          <div style={{ width: `${panelWidth}px` }} className="flex-shrink-0">
            <AAAgent state={agentState} thinkingLogs={thinkingLogs} />
          </div>
        </div>

        <footer className="border-t border-border bg-card flex-shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isGeminiConfigured && sessionInitialized && (
                <div className="flex items-center gap-2 text-secondary text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>GEMINI API未設定</span>
                </div>
              )}
              {isGeminiConfigured && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>GEMINI AI有効化</span>
                </div>
              )}
            </div>

            <PixelButton
              onClick={handleNext}
              disabled={isProcessing || isDone || !sessionInitialized}
              size="lg"
            >
              {isProcessing ? '実行中...' : isDone ? 'ゲーム完了' : '[ NEXT ]'}
            </PixelButton>

            <div className="text-xs text-muted-foreground w-48">
              NEXTボタンをクリックして、AIに次の行動を決定させます
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
