/**
 * Helper utility to generate test analytics data for the admin dashboard
 */

import AnalyticsService from './AnalyticsService';

export

interface GameConfig {
  name: string;
  avgScore: number;
  scoreVariance: number;
  avgDuration: number;
  durationVariance: number;
  completionRate: number;
}

class TestDataGenerator {
  private static instance: TestDataGenerator;
  private gameConfigs: GameConfig[] = [
    { 
      name: 'Chess', 
      avgScore: 3.5, 
      scoreVariance: 1.5, 
      avgDuration: 300, 
      durationVariance: 120, 
      completionRate: 0.87 
    },
    { 
      name: 'TriviaBlitz', 
      avgScore: 75, 
      scoreVariance: 20, 
      avgDuration: 180, 
      durationVariance: 60, 
      completionRate: 0.92 
    },
    { 
      name: 'RadioSongGuess', 
      avgScore: 40, 
      scoreVariance: 15, 
      avgDuration: 240, 
      durationVariance: 90, 
      completionRate: 0.78 
    },
    { 
      name: 'RiddleMaster', 
      avgScore: 30, 
      scoreVariance: 12, 
      avgDuration: 150, 
      durationVariance: 45, 
      completionRate: 0.81 
    },
    { 
      name: 'MedicalAssistant', 
      avgScore: 85, 
      scoreVariance: 10, 
      avgDuration: 400, 
      durationVariance: 100, 
      completionRate: 0.95 
    },
    { 
      name: 'Checkers', 
      avgScore: 5, 
      scoreVariance: 2, 
      avgDuration: 200, 
      durationVariance: 80, 
      completionRate: 0.89 
    },
    { 
      name: 'TicTacToe', 
      avgScore: 1, 
      scoreVariance: 0.5, 
      avgDuration: 60, 
      durationVariance: 30, 
      completionRate: 0.98 
    }
  ];

  private constructor() {}

  public static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator();
    }
    return TestDataGenerator.instance;
  }

  /**
   * Generates random analytics data for testing
   * @param count Number of sessions to generate per game
   */
  public generateGameSessions(count: number = 20): void {
    const analytics = AnalyticsService.getInstance();
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    this.gameConfigs.forEach(game => {
      for (let i = 0; i < count; i++) {
        // Generate data for different time periods within the last 30 days
        const timeOffset = Math.random() * 30 * dayInMs;
        const sessionTime = now - timeOffset;
        
        // Create randomized metrics based on game config
        const score = this.randomize(game.avgScore, game.scoreVariance);
        const duration = this.randomize(game.avgDuration, game.durationVariance);
        const completed = Math.random() < game.completionRate;
        
        // Record the session
        analytics.recordGameSession({
          gameType: game.name,
          score: score,
          duration: duration,
          completed: completed,
          metadata: {
            testData: true,
            timestamp: sessionTime
          }
        });
      }
    });

    console.log(`Generated test data: ${count * this.gameConfigs.length} sessions`);
  }

  /**
   * Helper to add variance to a value
   */
  private randomize(base: number, variance: number): number {
    const randomFactor = ((Math.random() * 2) - 1) * variance;
    return Math.max(0, base + randomFactor);
  }
}

export default TestDataGenerator;
