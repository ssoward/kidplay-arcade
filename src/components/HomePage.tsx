import React from 'react';
import { Link } from 'react-router-dom';

const games = [
  { id: 'art-critic', name: 'Art Critic', emoji: '🎨', category: 'AI' },
  { id: 'atziri-world', name: "Atziri's World", emoji: '🌍', category: 'Educational' },
  { id: 'blackjack', name: 'Blackjack', emoji: '🂡', category: 'Card' },
  { id: 'checkers', name: 'Checkers', emoji: '🔴', category: 'Strategy' },
  { id: 'chess', name: 'Chess', emoji: '♟️', category: 'Strategy' },
  { id: 'code-breaker', name: 'Code Breaker', emoji: '🔐', category: 'Puzzle' },
  { id: 'connect-four', name: 'Connect Four', emoji: '🔵', category: 'Strategy' },
  { id: 'dots-and-boxes', name: 'Dots and Boxes', emoji: '⬜', category: 'Strategy' },
  { id: 'dream-interpreter', name: 'Dream Interpreter', emoji: '💭', category: 'AI' },
  { id: 'hangman', name: 'Hangman', emoji: '🎭', category: 'Word' },
  { id: 'joke-maker', name: 'Joke Maker', emoji: '😂', category: 'AI' },
  { id: 'maze-escape', name: 'Maze Escape', emoji: '🌀', category: 'Adventure' },
  { id: 'medical-assistant', name: 'Medical Assistant', emoji: '🏥', category: 'Educational' },
  { id: 'memory-match', name: 'Memory Match', emoji: '🧠', category: 'Memory' },
  { id: 'mind-sweep', name: 'Mind Sweep', emoji: '💣', category: 'Puzzle' },
  { id: 'pong', name: 'Pong', emoji: '🏓', category: 'Arcade' },
  { id: 'quick-math', name: 'Quick Math', emoji: '🔢', category: 'Educational' },
  { id: 'riddle-master', name: 'Riddle Master', emoji: '🧙', category: 'AI' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', emoji: '✂️', category: 'Classic' },
  { id: 'sight-words', name: 'Sight Words', emoji: '👁️', category: 'Educational' },
  { id: 'slide-puzzle', name: 'Slide Puzzle', emoji: '🧩', category: 'Puzzle' },
  { id: 'solitaire', name: 'Solitaire', emoji: '🃏', category: 'Card' },
  { id: 'radio-song-guess', name: 'Song Quiz', emoji: '🎵', category: 'Music' },
  { id: 'spot-difference', name: 'Spot the Difference', emoji: '🔍', category: 'Puzzle' },
  { id: 'storyteller', name: 'Storyteller', emoji: '📚', category: 'AI' },
  { id: 'sudoku', name: 'Sudoku', emoji: '🔠', category: 'Puzzle' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', emoji: '❌', category: 'Classic' },
  { id: 'trivia-blitz', name: 'Trivia Blitz', emoji: '❓', category: 'Trivia' },
  { id: 'twenty-questions', name: 'Twenty Questions', emoji: '🤔', category: 'AI' },
  { id: 'word-guess', name: 'Word Guess', emoji: '📝', category: 'Word' },
];

const HomePage: React.FC = () => {
  const categoryColors = {
    Educational: 'from-green-400 to-emerald-600',
    Strategy: 'from-purple-400 to-indigo-600', 
    Classic: 'from-orange-400 to-red-600',
    Word: 'from-blue-400 to-cyan-600',
    Memory: 'from-pink-400 to-rose-600',
    Card: 'from-yellow-400 to-amber-600',
    Puzzle: 'from-teal-400 to-green-600',
    Arcade: 'from-red-400 to-pink-600',
    Trivia: 'from-indigo-400 to-purple-600',
    Adventure: 'from-emerald-400 to-teal-600',
    AI: 'from-violet-400 to-purple-600',
    Music: 'from-fuchsia-400 to-pink-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative container mx-auto px-4 pt-16 pb-12">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              KidPlay Arcade
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover amazing games, challenge your mind, and have endless fun with our collection of interactive experiences!
            </p>
            <div className="flex justify-center space-x-8 text-gray-400 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{games.length}</div>
                <div className="text-sm">Games</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">AI</div>
                <div className="text-sm">Powered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">100%</div>
                <div className="text-sm">Free</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <Link key={game.id} to={`/game/${game.id}`} className="group">
              <div 
                className={`relative bg-gradient-to-br ${categoryColors[game.category as keyof typeof categoryColors]} p-1 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:-translate-y-2`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full border border-white/20">
                  <div className="text-center">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {game.emoji}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-yellow-300 transition-colors">
                      {game.name}
                    </h3>
                    <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      {game.category}
                    </span>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">Built with ❤️ for endless fun and learning</p>
            <p className="text-sm">Choose your adventure and let the games begin!</p>
            <div className="mt-4">
              <Link to="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
