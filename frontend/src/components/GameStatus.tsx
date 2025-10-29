import React from 'react';
import { GameLog } from '@/types/game';

interface GameStatusProps {
  logs: GameLog[];
  isActive: boolean;
  isProcessing: boolean;
}

export default function GameStatus({ logs, isActive, isProcessing }: GameStatusProps) {
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const availableActionsCount = latestLog?.available_actions?.length || 0;

  return (
    <div className="pixel-border bg-card p-3 space-y-2">
      <h3 className="text-sm font-bold text-primary border-b border-border pb-2">
        GAME STATUS
      </h3>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ステータス:</span>
          <span className={`font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            {isProcessing ? '処理中...' : isActive ? 'アクティブ' : '待機中'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">ターン数:</span>
          <span className="font-bold text-foreground">{logs.length}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">利用可能なアクション:</span>
          <span className="font-bold text-foreground">{availableActionsCount}</span>
        </div>

        {latestLog && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">現在のスコア:</span>
            <span className="font-bold text-secondary">
              {latestLog.score}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
