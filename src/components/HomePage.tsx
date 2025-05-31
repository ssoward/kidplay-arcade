import React from 'react';
import { Link } from 'react-router-dom';

const games = [
  { id: 'sight-words', name: 'Sight Words' },
  { id: 'chess', name: 'Chess' },
  { id: 'checkers', name: 'Checkers' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe' },
  { id: 'hangman', name: 'Hangman' },
  { id: 'memory-match', name: 'Memory Match' },
  { id: 'dots-and-boxes', name: 'Dots and Boxes' },
  { id: 'connect-four', name: 'Connect Four' },
  { id: 'solitaire', name: 'Solitaire' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors' },
  { id: 'slide-puzzle', name: 'Slide Puzzle' },
  { id: 'pong', name: 'Pong' },
  { id: 'quick-math', name: 'Quick Math' },
  { id: 'sudoku', name: 'Sudoku' },
  { id: 'blackjack', name: 'Blackjack' },
  { id: 'trivia-blitz', name: 'Trivia Blitz' },
  { id: 'spot-difference', name: 'Spot the Difference' },
  { id: 'maze-escape', name: 'Maze Escape' },
  { id: 'mind-sweep', name: 'Mind Sweep' },
  { id: 'twenty-questions', name: 'Twenty Questions' },
  { id: 'word-guess', name: 'Word Guess' },
  { id: 'storyteller', name: 'Storyteller' },
  { id: 'art-critic', name: 'Art Critic' },
  { id: 'riddle-master', name: 'Riddle Master' },
  { id: 'code-breaker', name: 'Code Breaker' },
  { id: 'dream-interpreter', name: 'Dream Interpreter' },
  { id: 'joke-maker', name: 'Joke Maker' },
  { id: 'radio-song-guess', name: 'Song Quiz' },
];

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to PlayHub Arcade!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link key={game.id} to={`/game/${game.id}`}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:bg-blue-100 cursor-pointer transition">
              <h2 className="text-xl font-semibold text-center">{game.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
