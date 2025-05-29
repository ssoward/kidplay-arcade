import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './Chess.css';

const getAIWord = async () => {
  // Ask backend AI for a random word
  const history = [
    { role: 'system', content: 'You are a word game master. Pick a random, fun, family-friendly word for a game of hangman. Respond ONLY with the word, no explanation.' }
  ];
  const res = await axios.post('/api/ask-ai', { history });
  return (res.data.message || '').toLowerCase().replace(/[^a-z]/g, '');
};

const getAIHint = async (word: string) => {
  // Ask backend AI for a hint about the word
  const history = [
    { role: 'system', content: 'You are a helpful assistant for a hangman game.' },
    { role: 'user', content: `Give a clever, family-friendly hint for the word: "${word}". Do NOT reveal the word itself. Respond with only the hint.` }
  ];
  const res = await axios.post('/api/ask-ai', { history });
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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-purple-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Word Detective 🔍</h1>
        <p className="text-lg opacity-90">Guess the word before the hangman is complete!</p>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <svg height="120" width="120" className="mb-2">
          {/* Gallows */}
          <line x1="10" y1="110" x2="110" y2="110" stroke="#444" strokeWidth="6" />
          <line x1="30" y1="110" x2="30" y2="20" stroke="#444" strokeWidth="6" />
          <line x1="30" y1="20" x2="80" y2="20" stroke="#444" strokeWidth="6" />
          <line x1="80" y1="20" x2="80" y2="35" stroke="#444" strokeWidth="6" />
          {/* Head */}
          {wrong.length > 0 && <circle cx="80" cy="45" r="10" stroke="#222" strokeWidth="4" fill="none" />}
          {/* Body */}
          {wrong.length > 1 && <line x1="80" y1="55" x2="80" y2="80" stroke="#222" strokeWidth="4" />}
          {/* Left Arm */}
          {wrong.length > 2 && <line x1="80" y1="60" x2="70" y2="70" stroke="#222" strokeWidth="4" />}
          {/* Right Arm */}
          {wrong.length > 3 && <line x1="80" y1="60" x2="90" y2="70" stroke="#222" strokeWidth="4" />}
          {/* Left Leg */}
          {wrong.length > 4 && <line x1="80" y1="80" x2="70" y2="95" stroke="#222" strokeWidth="4" />}
          {/* Right Leg */}
          {wrong.length > 5 && <line x1="80" y1="80" x2="90" y2="95" stroke="#222" strokeWidth="4" />}
        </svg>
        <div className="text-3xl font-mono tracking-widest mb-2 text-gray-800">{displayWord}</div>
        <div className="mb-2 text-lg text-gray-700">Wrong guesses: {wrong.join(', ')}</div>
        <div className="mb-4 flex flex-col items-center gap-2">
          {alphabet.map(l => (
            <button
              key={l}
              onClick={() => handleGuess(l)}
              className={`chess-btn m-1 w-8 h-8 rounded-full font-bold text-lg transition-all
                ${guessed.includes(l) || wrong.includes(l) ? 'bg-gray-300 text-gray-400' : 'bg-gradient-to-br from-pink-400 to-purple-400 text-white hover:scale-110'}`}
              disabled={guessed.includes(l) || wrong.includes(l) || gameStatus !== 'playing'}
              aria-label={`Guess letter ${l}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-col items-center gap-2">
          <button
            onClick={handleHint}
            className="chess-btn bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
            disabled={hintLoading || gameStatus !== 'playing'}
          >
            {hintLoading ? 'Getting Hint...' : 'Hint'}
          </button>
          {hint && (
            <div className="text-md text-purple-700 bg-yellow-100 rounded-lg px-4 py-2 shadow max-w-xs text-center">{hint}</div>
          )}
        </div>
        {gameStatus === 'won' && <div className="text-2xl font-bold text-green-600 mb-2">You solved it! 🎉</div>}
        {gameStatus === 'lost' && <div className="text-2xl font-bold text-red-600 mb-2">Game Over! The word was <span className="underline">{word}</span></div>}
        <button
          onClick={resetGame}
          className="chess-btn bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
        >
          New Word
        </button>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🔍</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Guess the word by clicking letters</li>
          <li>• Each wrong guess draws part of the hangman</li>
          <li>• You win by guessing all letters before the hangman is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default Hangman;
