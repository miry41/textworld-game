export interface GameLog {
  id: string;
  action: string;
  observation: string;
  score: number;
  reward: number;
  done: boolean;
  timestamp: number;
  available_actions?: string[];
}

export interface GameState {
  currentGame: string | null;
  mode: 'manual' | 'auto' | null;
  logs: GameLog[];
  isProcessing: boolean;
  autoRunning: boolean;
  currentStep: number;
  totalReward: number;
  isDone: boolean;
}

export const GAMES = [
  {
    id: 'treasure-hunt',
    name: 'Treasure Hunt',
    difficulty: 'Medium',
    description: 'Find the hidden treasure in a mysterious mansion filled with puzzles and secrets.',
    maxSteps: 50,
  },
];

export const AI_AGENT_STATES = {
  idle: {
    message: "準備OK。短文で誘導してね。",
    mood: "😊",
  },
  thinking: {
    message: "考え中…",
    mood: "🤔",
  },
  success: {
    message: "実行しました！",
    mood: "✨",
  },
  error: {
    message: "うまくいかなかった…言い換えてみて",
    mood: "😅",
  },
  auto: {
    message: "自動進行中…",
    mood: "🔄",
  },
};
