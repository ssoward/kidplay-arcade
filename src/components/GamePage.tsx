import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';

const gameComponentMap: Record<string, any> = {
  'sight-words': lazy(() => import('../games/SightWords')),
  'atzris-world': lazy(() => import('../games/AtzrisWorld')),
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
  'medical-assistant': lazy(() => import('../games/MedicalAssistant')),
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-4"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  const GameComponent = gameComponentMap[gameId];

  if (!GameComponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="text-6xl mb-4">🎮</div>
          <div className="text-red-400 text-xl mb-2">Game not found</div>
          <div className="text-white/70">The game you're looking for doesn't exist.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="text-center mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-4"></div>
            <div className="text-white">Loading game...</div>
          </div>
        }>
          <GameComponent />
        </Suspense>
      </div>
    </div>
  );
};

export default GamePage;
