export interface StepResponse {
  observation: string;
  score: number;
  reward: number;
  done: boolean;
  available_actions?: string[];
  current_step?: number;
  max_steps?: number;
}

export interface ResetResponse {
  session_id: string;
  observation: string;
  score: number;
  done: boolean;
  available_actions?: string[];
  current_step?: number;
  max_steps?: number;
}

export interface GeminiActionResponse {
  suggested_action: string;
  reasoning?: string;
  is_fallback: boolean;
}

export class TextWorldAPIClient {
  private baseURL: string;
  private currentSessionId: string | null = null;

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async createSession(gameId: string = 'simple_game'): Promise<ResetResponse> {
    const response = await this.request<ResetResponse>('/reset', {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    });
    this.currentSessionId = response.session_id;
    return response;
  }

  async executeAction(action: string): Promise<StepResponse> {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }
    return this.request<StepResponse>('/step', {
      method: 'POST',
      body: JSON.stringify({
        session_id: this.currentSessionId,
        action,
      }),
    });
  }

  async getGeminiSuggestedAction(
    observation: string,
    availableActions: string[],
    score: number,
    userInstruction?: string
  ): Promise<GeminiActionResponse> {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }
    return this.request<GeminiActionResponse>('/gemini/suggest-action', {
      method: 'POST',
      body: JSON.stringify({
        session_id: this.currentSessionId,
        observation,
        available_actions: availableActions,
        score,
        user_instruction: userInstruction,
      }),
    });
  }

  async healthCheck(): Promise<{ status: string; gemini_api_configured?: boolean }> {
    return this.request<{ status: string; gemini_api_configured?: boolean }>('/healthz');
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const apiClient = new TextWorldAPIClient();
