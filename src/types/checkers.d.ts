declare module 'checkers.js' {
  class CheckersGame {
    move(from: string, to: string): boolean;
    getBoard(): any;
    getCurrentPlayer(): string;
    isGameOver(): boolean;
    getWinner(): string | null;
    getPossibleMoves(square?: string): string[];
    // Add more methods as needed
  }
  
  export = CheckersGame;
}
