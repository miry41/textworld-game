import React from 'react';
import { AI_AGENT_STATES } from '@/types/game';

export interface ThinkingLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'observation' | 'thinking' | 'action' | 'result';
}

interface AAAgentProps {
  state: keyof typeof AI_AGENT_STATES;
  userInput?: string;
  lastAction?: string;
  thinkingLogs?: ThinkingLog[];
}

export default function AAAgent({ state, userInput, lastAction, thinkingLogs = [] }: AAAgentProps) {
  const agentState = AI_AGENT_STATES[state];

  const getMoodDescription = () => {
    switch (state) {
      case 'idle': return '待機中';
      case 'thinking': return '思考中';
      case 'success': return '実行完了';
      case 'error': return 'エラー';
      case 'auto': return '自動進行';
      default: return '不明';
    }
  };

  const getAACharacter = () => {
    const baseCharacter = `    ∩───∩
   （ ◕   ◕ ）
    ∪ ─── ∪
      ∪   ∪`;

    const thinkingCharacter = `    ∩───∩
   （ ◔   ◔ ）
    ∪ ─── ∪
      ∪   ∪`;

    const happyCharacter = `    ∩───∩
   （ ◕   ◕ ）
    ∪  ω  ∪
      ∪   ∪`;

    switch (state) {
      case 'thinking':
      case 'auto':
        return thinkingCharacter;
      case 'success':
        return happyCharacter;
      default:
        return baseCharacter;
    }
  };

  const getLogTypeColor = (type: ThinkingLog['type']) => {
    switch (type) {
      case 'observation': return 'text-blue-400';
      case 'thinking': return 'text-yellow-400';
      case 'action': return 'text-green-400';
      case 'result': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const getLogTypeLabel = (type: ThinkingLog['type']) => {
    switch (type) {
      case 'observation': return '📋 観察';
      case 'thinking': return '💭 思考';
      case 'action': return '⚡ 行動';
      case 'result': return '✅ 結果';
      default: return '📝';
    }
  };

  return (
    <div className="pixel-border bg-card flex flex-col h-full">
      {/* 思考ログエリア */}
      <div className="flex-1 overflow-hidden flex flex-col border-b border-border">
        <div className="px-3 py-2 bg-muted/50 border-b border-border">
          <h3 className="text-xs font-bold text-primary">AI思考ログ</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {thinkingLogs.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              思考ログはまだありません
            </div>
          ) : (
            thinkingLogs.map((log) => (
              <div key={log.id} className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getLogTypeColor(log.type)}`}>
                    {getLogTypeLabel(log.type)}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-foreground/90 pl-2 border-l-2 border-border">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* キャラクター表示エリア */}
      <div className="flex items-center justify-center py-3">
        <div className={`${state === 'thinking' || state === 'auto' ? 'thinking-pulse' : ''}`}>
          <pre className="text-primary text-sm leading-tight font-mono whitespace-pre text-center select-none">
            {getAACharacter()}
          </pre>
        </div>
      </div>
    </div>
  );
}
