import React, { useEffect, useRef } from 'react';
import { GameLog as GameLogType } from '@/types/game.ts';

interface GameLogProps {
  logs: GameLogType[];
}

export default function GameLog({ logs }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
      {logs.length === 0 && (
        <div className="text-muted-foreground text-center py-8">
          ゲームログがまだありません
        </div>
      )}

      {logs.map((log, index) => (
        <div key={log.id} className="pixel-fade-in space-y-2">
          <div className="text-xs text-muted-foreground">
            [{formatTimestamp(log.timestamp)}] Turn {index + 1}
          </div>

          <div className="space-y-1">
            <div className="text-primary font-bold text-xs">
              &gt; {log.action}
            </div>

            <div className="text-foreground pl-4 text-xs leading-tight">
              {log.observation}
            </div>

            <div className="text-muted-foreground pl-4 text-xs">
              スコア: <span className="text-primary font-bold">{log.score}</span>
              {log.reward !== 0 && (
                <span className="ml-4">
                  報酬: <span className={`font-bold ${log.reward > 0 ? 'text-secondary' : 'text-red-500'}`}>
                    {log.reward > 0 ? '+' : ''}{log.reward}
                  </span>
                </span>
              )}
            </div>

            {log.done && (
              <div className="text-secondary font-bold pl-4">
                ✓ ゲーム完了！
              </div>
            )}
          </div>

          {index < logs.length - 1 && (
            <div className="border-t border-border opacity-30 mt-4"></div>
          )}
        </div>
      ))}
    </div>
  );
}
