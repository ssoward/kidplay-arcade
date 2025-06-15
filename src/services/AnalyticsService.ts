// Simple analytics service to track game sessions
import { API_CONFIG } from '../config/api';

interface GameSession {
  gameType: string;
  score?: number;
  duration?: number;
  completed?: boolean;
  metadata?: any;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async recordGameSession(session: GameSession): Promise<void> {
    try {
      // Also store in localStorage for offline tracking
      this.storeSessionLocally(session);

      // Try to send to backend (don't fail if backend is down)
      await fetch(`${this.baseUrl}/api/admin/record-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });
    } catch (error) {
      console.warn('Failed to record session to backend:', error);
      // Continue silently - we still have local storage
    }
  }

  private storeSessionLocally(session: GameSession): void {
    try {
      const key = `${session.gameType.toLowerCase()}_sessions`;
      const existing = localStorage.getItem(key);
      const sessions = existing ? JSON.parse(existing) : [];
      
      sessions.push({
        ...session,
        timestamp: new Date().toISOString(),
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      });

      // Keep only last 50 sessions per game to prevent storage bloat
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
      }

      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (error) {
      console.warn('Failed to store session locally:', error);
    }
  }

  public getGameSessions(gameType: string): any[] {
    try {
      const key = `${gameType.toLowerCase()}_sessions`;
      const existing = localStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.warn('Failed to retrieve local sessions:', error);
      return [];
    }
  }

  public getAllLocalSessions(): Record<string, any[]> {
    const sessions: Record<string, any[]> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('_sessions')) {
          const gameType = key.replace('_sessions', '');
          const data = localStorage.getItem(key);
          if (data) {
            sessions[gameType] = JSON.parse(data);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve all local sessions:', error);
    }

    return sessions;
  }

  public clearGameSessions(gameType?: string): void {
    try {
      if (gameType) {
        const key = `${gameType.toLowerCase()}_sessions`;
        localStorage.removeItem(key);
      } else {
        // Clear all game sessions
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.endsWith('_sessions')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear sessions:', error);
    }
  }
}

export default AnalyticsService;
