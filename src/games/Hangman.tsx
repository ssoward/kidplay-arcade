import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
// import './Chess.css';

const getAIWord = async () => {
  // Ask backend AI for a random word
  const history = [
    { role: 'system', content: 'You are a word game master. Pick a random, fun, family-friendly word for a game of hangman. Respond ONLY with the word, no explanation.' }
  ];
  const res = await axios.post(`${API_CONFIG.BASE_URL}/api/ask-ai`, { history });
  return (res.data.message || '').toLowerCase().replace(/[^a-z]/g, '');
};

const getAIHint = async (word: string) => {
  // Ask backend AI for a hint about the word
  const history = [
    { role: 'system', content: 'You are a helpful assistant for a hangman game.' },
    { role: 'user', content: `Give a clever, family-friendly hint for the word: "${word}". Do NOT reveal the word itself. Respond with only the hint.` }
  ];
  const res = await axios.post(`${API_CONFIG.BASE_URL}/api/ask-ai`, { history });
  return res.data.message;
};

const Hangman: React.FC = () => {
  const [word, setWord] = React.useState<string>('');
  const [guessed, setGuessed] = React.useState<string[]>([]);
  const [wrong, setWrong] = React.useState<string[]>([]);
  const [gameStatus, setGameStatus] = React.useState<'playing' | 'won' | 'lost'>('playing');
  const [hint, setHint] = React.useState<string | null>(null);
  const [hintLoading, setHintLoading] = React.useState(false);

  const maxWrong = 6;
  const displayWord = word.split('').map(l => (guessed.includes(l) ? l : '_')).join(' ');

  // Fetch AI word on mount
  React.useEffect(() => {
    (async () => {
      const aiWord = await getAIWord();
      setWord(aiWord);
    })();
  }, []);

  // Only check for win/loss if a word is present
  React.useEffect(() => {
    if (!word) return;
    if (displayWord.replace(/ /g, '') === word) setGameStatus('won');
    else if (wrong.length >= maxWrong) setGameStatus('lost');
    else setGameStatus('playing');
  }, [guessed, wrong, word, displayWord]);

  const handleGuess = (letter: string) => {
    console.log(`Guessing letter: ${letter}`);
    console.log(`Current word: ${word}`);
    console.log(`gameStatus: ${gameStatus}`);
    if (gameStatus !== 'playing' || guessed.includes(letter) || wrong.includes(letter) || !word) return;
    if (word.includes(letter)) setGuessed(g => [...g, letter]);
    else setWrong(w => [...w, letter]);
  };

  const resetGame = async () => {
    const aiWord = await getAIWord();
    setWord(aiWord);
    setGuessed([]);
    setWrong([]);
    setGameStatus('playing');
    setHint(null);
  };

  const handleHint = async () => {
    setHintLoading(true);
    const aiHint = await getAIHint(word);
    setHint(aiHint);
    setHintLoading(false);
  };

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Word Detective 🔍
        </h1>
        <p className="text-xl text-gray-600">Guess the word before the hangman is complete!</p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 border border-white/20">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <svg height="140" width="140" className="drop-shadow-md">
              {/* Gallows with enhanced styling */}
              <line x1="15" y1="120" x2="125" y2="120" stroke="#4a5568" strokeWidth="8" strokeLinecap="round" />
              <line x1="35" y1="120" x2="35" y2="25" stroke="#4a5568" strokeWidth="8" strokeLinecap="round" />
              <line x1="35" y1="25" x2="90" y2="25" stroke="#4a5568" strokeWidth="8" strokeLinecap="round" />
              <line x1="90" y1="25" x2="90" y2="40" stroke="#4a5568" strokeWidth="8" strokeLinecap="round" />
              {/* Head */}
              {wrong.length > 0 && <circle cx="90" cy="50" r="12" stroke="#e53e3e" strokeWidth="4" fill="#fed7d7" />}
              {/* Body */}
              {wrong.length > 1 && <line x1="90" y1="62" x2="90" y2="95" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round" />}
              {/* Left Arm */}
              {wrong.length > 2 && <line x1="90" y1="70" x2="75" y2="85" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round" />}
              {/* Right Arm */}
              {wrong.length > 3 && <line x1="90" y1="70" x2="105" y2="85" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round" />}
              {/* Left Leg */}
              {wrong.length > 4 && <line x1="90" y1="95" x2="75" y2="115" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round" />}
              {/* Right Leg */}
              {wrong.length > 5 && <line x1="90" y1="95" x2="105" y2="115" stroke="#e53e3e" strokeWidth="4" strokeLinecap="round" />}
            </svg>
          </div>
          
          <div className="text-4xl font-mono tracking-[0.3em] mb-4 text-gray-800 bg-gray-100 px-6 py-3 rounded-xl shadow-inner">
            {displayWord}
          </div>
          
          {wrong.length > 0 && (
            <div className="mb-4 text-lg text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              <span className="font-semibold">Wrong guesses:</span> {wrong.join(', ').toUpperCase()}
            </div>
          )}
        </div>
      </div>
        <div className="mb-6 max-w-lg">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {alphabet.map(l => (
              <button
                key={l}
                onClick={() => handleGuess(l)}
                className={`w-10 h-10 rounded-full font-bold text-lg transition-all transform shadow-md
                  ${guessed.includes(l) || wrong.includes(l) 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:scale-110 hover:shadow-lg active:scale-95'
                  }`}
                disabled={guessed.includes(l) || wrong.includes(l) || gameStatus !== 'playing'}
                aria-label={`Guess letter ${l.toUpperCase()}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6 flex flex-col items-center gap-4">
          <button
            onClick={handleHint}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={hintLoading || gameStatus !== 'playing'}
          >
            {hintLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Getting Hint...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                💡 Get Hint
              </span>
            )}
          </button>
          {hint && (
            <div className="animate-bounce-in bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-400 text-gray-800 p-4 rounded-lg shadow-md max-w-xs text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <span className="text-yellow-600">💡</span>
                <span className="font-semibold text-sm text-yellow-700">HINT</span>
              </div>
              <div className="text-sm">{hint}</div>
            </div>
          )}
        </div>
        {gameStatus === 'won' && (
          <div className="mb-4 p-6 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl shadow-lg text-center animate-bounce-in">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-green-700 mb-1">Congratulations!</div>
            <div className="text-green-600">You solved the word!</div>
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="mb-4 p-6 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-2xl shadow-lg text-center">
            <div className="text-4xl mb-2">😞</div>
            <div className="text-2xl font-bold text-red-700 mb-1">Game Over!</div>
            <div className="text-red-600">The word was <span className="font-bold underline">{word}</span></div>
          </div>
        )}
        <button
          onClick={resetGame}
          className="px-8 py-3 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          <span className="flex items-center gap-2">
            🔄 New Word
          </span>
        </button>
      
      <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 max-w-md shadow-lg border border-white/30">
        <h3 className="font-bold text-xl mb-4 text-gray-800 text-center flex items-center justify-center gap-2">
          <span>📖</span> How to Play
        </h3>
        <ul className="text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">1.</span>
            <span>Guess the word by clicking letters</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">2.</span>
            <span>Each wrong guess draws part of the hangman</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">3.</span>
            <span>Win by guessing all letters before the drawing is complete</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 font-bold">💡</span>
            <span>Use the hint button if you get stuck!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Hangman;
