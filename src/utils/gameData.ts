import { Game } from '../types/Game';

export const games: Game[] = [
  {
    id: 'checkers',
    name: 'Checkers Champion',
    description: 'Jump your way to victory in this classic board game with smart AI competition',
    category: 'strategy',
    ageRange: '6-14',
    players: '1-2',
    icon: '🔴',
    color: 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-500'
  },
  {
    id: 'chess',
    name: 'Chess Master',
    description: '', // Required by type, left blank as requested
    category: 'strategy',
    ageRange: '8-14',
    players: '1-2',
    icon: '♕',
    color: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500'
  },
  {
    id: 'minesweeper',
    name: 'Mind Sweep Adventure',
    description: 'Use logic and deduction to safely navigate through hidden mine fields',
    category: 'puzzle',
    ageRange: '8-14',
    players: '1',
    icon: '💎',
    color: 'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-600'
  },
  {
    id: 'memory-match',
    name: 'Memory Palace',
    description: 'Train your memory by matching beautiful cards with multiple difficulty levels',
    category: 'puzzle',
    ageRange: '6-14',
    players: '1',
    icon: '🧠',
    color: 'bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500'
  },
  {
    id: 'hangman',
    name: 'Word Detective',
    description: 'Solve mysterious words letter by letter with helpful hints and clues',
    category: 'puzzle',
    ageRange: '7-14',
    players: '1',
    icon: '🔍',
    color: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Pro',
    description: 'Challenge yourself in the classic strategy game with advanced AI tactics',
    category: 'strategy',
    ageRange: '6-14',
    players: '1-2',
    icon: '⚡',
    color: 'bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500'
  },
  {
    id: 'sudoku',
    name: 'Number Ninja',
    description: 'Master the art of number placement in this brain-training puzzle challenge',
    category: 'logic',
    ageRange: '9-14',
    players: '1',
    icon: '🔢',
    color: 'bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600'
  },
  {
    id: 'twenty-questions',
    name: 'Mind Reader',
    description: 'Challenge the AI to guess what you\'re thinking in this exciting guessing game',
    category: 'trivia',
    ageRange: '7-14',
    players: '1',
    icon: '🔮',
    color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500'
  },
  {
    id: 'solitaire',
    name: 'Royal Solitaire',
    description: 'Experience the classic Klondike card game with beautiful animations and hints',
    category: 'card',
    ageRange: '8-14',
    players: '1',
    icon: '🃏',
    color: 'bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500'
  },
  {
    id: 'dots-and-boxes',
    name: 'Box Builder',
    description: 'Connect the dots strategically to create boxes and outsmart your opponent',
    category: 'strategy',
    ageRange: '7-14',
    players: '1-2',
    icon: '📦',
    color: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500'
  },
  {
    id: 'blackjack',
    name: 'Lucky 21',
    description: 'Master the art of card counting and strategy to beat the dealer at 21',
    category: 'card',
    ageRange: '10-14',
    players: '1',
    icon: '🎰',
    color: 'bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-700'
  },
  {
    id: 'connect-four',
    name: 'Connect Champion',
    description: 'Drop your pieces strategically to get four in a row before your opponent',
    category: 'strategy',
    ageRange: '6-14',
    players: '1-2',
    icon: '🟡',
    color: 'bg-gradient-to-br from-yellow-500 via-orange-400 to-red-400'
  },
  {
    id: 'word-guess',
    name: 'Word Wizard',
    description: 'Discover hidden words with clever clues in this Wordle-inspired challenge',
    category: 'puzzle',
    ageRange: '8-14',
    players: '1',
    icon: '✨',
    color: 'bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500'
  },
  {
    id: 'pong',
    name: 'Paddle Master',
    description: 'Experience the classic game with modern twists and power-ups',
    category: 'puzzle',
    ageRange: '6-14',
    players: '1',
    icon: '🏓',
    color: 'bg-gradient-to-br from-cyan-500 via-blue-400 to-indigo-500'
  },
  {
    id: 'rock-paper-scissors',
    name: 'RPS Arena',
    description: 'Test your luck and strategy against an intelligent AI in this classic game',
    category: 'puzzle',
    ageRange: '6-14',
    players: '1',
    icon: '✂️',
    color: 'bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500'
  },
  {
    id: 'slide-puzzle',
    name: 'Slide Quest',
    description: 'Arrange numbered tiles in perfect order using logic and spatial reasoning',
    category: 'puzzle',
    ageRange: '7-14',
    players: '1',
    icon: '🧩',
    color: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500'
  },
  {
    id: 'spot-difference',
    name: 'Eagle Eye',
    description: 'Sharpen your observation skills by finding differences between beautiful scenes',
    category: 'puzzle',
    ageRange: '6-14',
    players: '1',
    icon: '👁️',
    color: 'bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500'
  },
  {
    id: 'maze-escape',
    name: 'Maze Runner',
    description: 'Navigate through challenging mazes and find your way to freedom',
    category: 'puzzle',
    ageRange: '7-14',
    players: '1',
    icon: '🏃‍♂️',
    color: 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-violet-600'
  },
  {
    id: 'trivia-blitz',
    name: 'Brain Blitz',
    description: 'Test your knowledge across multiple subjects in this fast-paced trivia challenge',
    category: 'trivia',
    ageRange: '8-14',
    players: '1',
    icon: '🧠',
    color: 'bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600'
  },
  {
    id: 'storyteller',
    name: 'AI Storyteller',
    description: 'Take turns with the AI to create a fun, imaginative story. Choose a genre and see where your creativity leads!',
    category: 'puzzle',
    ageRange: '6-99',
    players: '1',
    icon: '📖',
    color: 'bg-gradient-to-br from-yellow-400 via-orange-300 to-pink-400'
  }
];
