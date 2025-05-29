import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { games } from '../utils/gameData';
import { Game } from '../types/Game';

// Import game components
import TicTacToe from '../games/TicTacToe';
import MemoryMatch from '../games/MemoryMatch';
import RockPaperScissors from '../games/RockPaperScissors';
import QuickMath from '../games/QuickMath';
import Hangman from '../games/Hangman';
import ConnectFour from '../games/ConnectFour';
import Sudoku from '../games/Sudoku';
import MindSweep from '../games/MindSweep';
import Chess from '../games/Chess';
import SlidePuzzle from '../games/SlidePuzzle';
import Checkers from '../games/Checkers';
import TwentyQuestions from '../games/TwentyQuestions';
import Solitaire from '../games/Solitaire';
import DotsAndBoxes from '../games/DotsAndBoxes';
import Blackjack from '../games/Blackjack';
import WordGuess from '../games/WordGuess';
import Pong from '../games/Pong';
import SpotDifference from '../games/SpotDifference';
import MazeEscape from '../games/MazeEscape';
import TriviaBlitz from '../games/TriviaBlitz';
import Storyteller from '../games/Storyteller';


const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameKey, setGameKey] = useState(0);

  const game = games.find((g: Game) => g.id === gameId);

  if (!game) {
    return <Navigate to="/" replace />;
  }

  const restartGame = () => {
    setGameKey(prev => prev + 1);
  };

  const handleGameExit = () => {
    // For now, just restart the game when exit is called
    restartGame();
  };

  const renderGame = () => {
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToe key={gameKey} />;
      case 'memory-match':
        return <MemoryMatch key={gameKey} />;
      case 'rock-paper-scissors':
        return <RockPaperScissors key={gameKey} />;
      case 'quick-math':
        return <QuickMath key={gameKey} />;
      case 'hangman':
        return <Hangman key={gameKey} />;
      case 'connect-four':
        return <ConnectFour key={gameKey} />;
      // Remove onExit prop from placeholder games
      case 'maze-escape':
        return <MazeEscape key={gameKey} />;
      case 'spot-difference':
        return <SpotDifference key={gameKey} />;
      case 'dots-and-boxes':
        return <DotsAndBoxes key={gameKey} />;
      case 'slide-puzzle':
        return <SlidePuzzle key={gameKey} />;
      case 'sudoku':
        return <Sudoku key={gameKey} />;
      case 'solitaire':
        return <Solitaire key={gameKey} />;
      case 'checkers':
        return <Checkers key={gameKey} onExit={handleGameExit} />;
      case 'twenty-questions':
        return <TwentyQuestions key={gameKey} onExit={handleGameExit} />;
      case 'blackjack':
        return <Blackjack key={gameKey} onExit={handleGameExit} />;
      // Remove onExit prop from WordGuess
      case 'word-guess':
        return <WordGuess key={gameKey} />;
      case 'pong':
        return <Pong key={gameKey} />;
      case 'chess':
        return <Chess key={gameKey} />;
      case 'minesweeper':
        return <MindSweep key={gameKey} />;
      case 'storyteller':
        return <Storyteller key={gameKey} />;  


      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">Coming Soon!</h3>
            <p className="text-gray-500">This game is still being developed. Check back soon!</p>
          </div>
        );
    }
  };

  const gameRules: { [key: string]: string[] } = {
    'tic-tac-toe': [
      'Players take turns placing X and O on a 3x3 grid',
      'Get three of your symbols in a row (horizontal, vertical, or diagonal) to win',
      'If all spaces are filled with no winner, it\'s a tie'
    ],
    'memory-match': [
      'Flip cards to reveal pictures underneath',
      'Find matching pairs by remembering where cards are located',
      'Match all pairs to win the game',
      'Try to complete it in the fewest moves possible'
    ],
    'rock-paper-scissors': [
      'Choose Rock, Paper, or Scissors',
      'Rock beats Scissors, Scissors beats Paper, Paper beats Rock',
      'First to win 3 rounds is the champion!',
      'Good luck beating the AI!'
    ],
    'quick-math': [
      'Solve math problems as quickly as possible',
      'Answer gets harder as you progress',
      'Get the highest score before time runs out',
      'Perfect for practicing math skills!'
    ],
    'hangman': [
      'Guess the hidden word letter by letter',
      'Each wrong guess adds a part to the hangman',
      'Guess the word before the drawing is complete',
      'Choose your letters wisely!'
    ],
    'connect-four': [
      'Drop colored discs into the grid',
      'Get four in a row horizontally, vertically, or diagonally to win',
      'Take turns with the AI opponent',
      'Plan your moves carefully to block your opponent!'
    ],
    'sudoku': [
      'Fill the 9x9 grid with numbers 1-9',
      'Each row, column, and 3x3 box must contain all digits 1-9',
      'Use logic to solve the puzzle step by step',
      'Choose your difficulty level and use hints if needed!'
    ],
    'minesweeper': [
      'Click tiles to reveal what\'s underneath',
      'Numbers show how many mines are nearby',
      'Flag tiles you think contain mines',
      'Clear all safe tiles without hitting a mine!'
    ],
    'chess': [
      'Move pieces according to chess rules',
      'Capture the opponent\'s king to win (checkmate)',
      'Each piece has its own movement pattern',
      'Think strategically and plan your moves ahead!'
    ],
    'slide-puzzle': [
      'Slide numbered tiles to arrange them in order',
      'Use the empty space to move tiles around',
      'Get all numbers in sequence from 1 to the highest number',
      'Complete the puzzle in the fewest moves possible!'
    ],
    'checkers': [
      'Move your pieces diagonally on dark squares only',
      'Jump over opponent pieces to capture them',
      'Reach the far end to promote pieces to kings',
      'Capture all opponent pieces or block their moves to win!'
    ],
    'twenty-questions': [
      'The AI thinks of something and you try to guess it',
      'Ask yes or no questions to narrow down the answer',
      'You have 20 questions to figure out what it is',
      'Use strategic questions to eliminate possibilities!'
    ],
    'solitaire': [
      'Move cards between piles to build foundations',
      'Build foundations from Ace to King by suit',
      'Reveal hidden cards by moving those on top',
      'Use strategy to uncover and organize all cards!'
    ],
    'dots-and-boxes': [
      'Take turns drawing lines between dots',
      'Complete a box by drawing its fourth side',
      'When you complete a box, you get another turn',
      'The player with the most boxes wins!'
    ],
    'blackjack': [
      'Get your cards as close to 21 as possible without going over',
      'Face cards are worth 10, Aces are 1 or 11',
      'Beat the dealer without busting (going over 21)',
      'Hit to get more cards, stand to keep your total!'
    ],
    'word-guess': [
      'Guess the hidden word in 6 tries or less',
      'Each guess must be a valid word',
      'Colors show if letters are correct, wrong position, or not in the word',
      'Use clues to figure out the mystery word!'
    ],
    'pong': [
      'Move your paddle up and down to hit the ball',
      'Keep the ball from getting past your paddle',
      'Score points when the ball gets past the opponent',
      'First to reach the target score wins!'
    ],
    'spot-difference': [
      'Find all the differences between two similar pictures',
      'Click on differences when you spot them',
      'Look carefully - some differences are subtle!',
      'Find all differences to complete the level!'
    ],
    'maze-escape': [
      'Navigate through the maze to reach the exit',
      'Use arrow keys or WASD to move your character',
      'Avoid dead ends and find the correct path',
      'Complete the maze as quickly as possible!'
    ],
    'trivia-blitz': [
      'Answer trivia questions as quickly as possible',
      'Choose from multiple categories and difficulty levels',
      'Each correct answer adds to your score',
      'Beat the clock to maximize your points!'
    ]
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {renderGame()}
      </div>
    </div>
  );
};

export default GamePage;

export {};
