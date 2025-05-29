import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const gameComponentMap: Record<string, any> = {
  chess: dynamic(() => import('../games/Chess'), { ssr: false }),
  checkers: dynamic(() => import('../games/Checkers'), { ssr: false }),
  'tic-tac-toe': dynamic(() => import('../games/TicTacToe'), { ssr: false }),
  hangman: dynamic(() => import('../games/Hangman'), { ssr: false }),
  'memory-match': dynamic(() => import('../games/MemoryMatch'), { ssr: false }),
  'dots-and-boxes': dynamic(() => import('../games/DotsAndBoxes'), { ssr: false }),
  'connect-four': dynamic(() => import('../games/ConnectFour'), { ssr: false }),
  solitaire: dynamic(() => import('../games/Solitaire'), { ssr: false }),
  'rock-paper-scissors': dynamic(() => import('../games/RockPaperScissors'), { ssr: false }),
  'slide-puzzle': dynamic(() => import('../games/SlidePuzzle'), { ssr: false }),
  pong: dynamic(() => import('../games/Pong'), { ssr: false }),
  'quick-math': dynamic(() => import('../games/QuickMath'), { ssr: false }),
  sudoku: dynamic(() => import('../games/Sudoku'), { ssr: false }),
  blackjack: dynamic(() => import('../games/Blackjack'), { ssr: false }),
  'trivia-blitz': dynamic(() => import('../games/TriviaBlitz'), { ssr: false }),
  'spot-difference': dynamic(() => import('../games/SpotDifference'), { ssr: false }),
  'maze-escape': dynamic(() => import('../games/MazeEscape'), { ssr: false }),
  'mind-sweep': dynamic(() => import('../games/MindSweep'), { ssr: false }),
  'twenty-questions': dynamic(() => import('../games/TwentyQuestions'), { ssr: false }),
  'word-guess': dynamic(() => import('../games/WordGuess'), { ssr: false }),
  storyteller: dynamic(() => import('../games/Storyteller'), { ssr: false }),
};

const GamePage: React.FC = () => {
  const router = useRouter();
  const { gameId } = router.query;

  if (!gameId || typeof gameId !== 'string') {
    return <div className="text-center mt-8">Loading...</div>;
  }

  const GameComponent = gameComponentMap[gameId];

  if (!GameComponent) {
    return <div className="text-center mt-8 text-red-500">Game not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GameComponent />
    </div>
  );
};

export default GamePage;
