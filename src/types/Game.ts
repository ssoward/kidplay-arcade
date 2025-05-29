export interface Game {
  id: string;
  name: string;
  description: string;
  category: 'logic' | 'card' | 'puzzle' | 'trivia' | 'strategy';
  ageRange: string;
  players: '1' | '2' | '1-2';
  icon: string;
  color: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score?: number;
  level?: number;
  timeElapsed?: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}
