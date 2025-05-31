import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';

const gameComponentMap: Record<string, any> = {
  'sight-words': lazy(() => import('../games/SightWords')),
  chess: lazy(() => import('../games/Chess')),
  checkers: lazy(() => import('../games/Checkers')),
  'tic-tac-toe': lazy(() => import('../games/TicTacToe')),
  hangman: lazy(() => import('../games/Hangman')),
  'memory-match': lazy(() => import('../games/MemoryMatch')),
  'dots-and-boxes': lazy(() => import('../games/DotsAndBoxes')),
  'connect-four': lazy(() => import('../games/ConnectFour')),
  solitaire: lazy(() => import('../games/Solitaire')),
  'rock-paper-scissors': lazy(() => import('../games/RockPaperScissors')),
  'slide-puzzle': lazy(() => import('../games/SlidePuzzle')),
  pong: lazy(() => import('../games/Pong')),
  'quick-math': lazy(() => import('../games/QuickMath')),
  sudoku: lazy(() => import('../games/Sudoku')),
  blackjack: lazy(() => import('../games/Blackjack')),
  'trivia-blitz': lazy(() => import('../games/TriviaBlitz')),
  'spot-difference': lazy(() => import('../games/SpotDifference')),
  'maze-escape': lazy(() => import('../games/MazeEscape')),
  'mind-sweep': lazy(() => import('../games/MindSweep')),
  'twenty-questions': lazy(() => import('../games/TwentyQuestions')),
  'word-guess': lazy(() => import('../games/WordGuess')),
  storyteller: lazy(() => import('../games/Storyteller')),
  'art-critic': lazy(() => import('../games/ArtCritic')),
  'riddle-master': lazy(() => import('../games/RiddleMaster')),
  'code-breaker': lazy(() => import('../games/CodeBreaker')),
  'dream-interpreter': lazy(() => import('../games/DreamInterpreter')),
  'joke-maker': lazy(() => import('../games/JokeMaker')),
  'radio-song-guess': lazy(() => import('../games/RadioSongGuess')),
};

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();

  if (!gameId) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  const GameComponent = gameComponentMap[gameId];

  if (!GameComponent) {
    return <div className="text-center mt-8 text-red-500">Game not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center mt-8">Loading game...</div>}>
        <GameComponent />
      </Suspense>
    </div>
  );
};

export default GamePage;
