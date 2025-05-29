import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

// Fetch a random 5-letter word from the backend AI
const getAIWord = async () => {
  const history = [
    { role: 'system', content: 'You are a word game master. Pick a random, fun, family-friendly 5-letter word for a word guessing game. Respond ONLY with the word, no explanation.' }
  ];
  const res = await axios.post('/api/ask-ai', { history });
  // Only keep 5-letter alpha words, uppercase
  return (res.data.message || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
};

const WordGuess: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI word on mount and on restart
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const aiWord = await getAIWord();
        if (aiWord.length === 5) {
          setTargetWord(aiWord);
        } else {
          setError('Failed to get a valid word.');
        }
      } catch (e) {
        setError('Failed to fetch word from AI.');
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (guesses.length > 0 && guesses[guesses.length - 1] === targetWord) {
      setGameStatus('won');
    } else if (guesses.length >= MAX_ATTEMPTS) {
      setGameStatus('lost');
    }
  }, [guesses, targetWord]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameStatus !== 'playing') return;
    const value = e.target.value.toUpperCase();
    if (/^[A-Z]*$/.test(value) && value.length <= WORD_LENGTH) {
      setCurrentGuess(value);
    }
  };

  const handleGuess = () => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== WORD_LENGTH) return;
    setGuesses([...guesses, currentGuess]);
    setCurrentGuess('');
    // Focus the first input after guess
    setTimeout(() => {
      const first = document.getElementById('wg-input-0');
      if (first) (first as HTMLInputElement).focus();
    }, 0);
  };

  const handleRestart = () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const aiWord = await getAIWord();
        if (aiWord.length === 5) {
          setTargetWord(aiWord);
        } else {
          setError('Failed to get a valid word.');
        }
      } catch (e) {
        setError('Failed to fetch word from AI.');
      }
      setLoading(false);
    })();
  };

  const getLetterStatus = (guess: string, idx: number) => {
    const result: ('correct' | 'present' | 'absent')[] = Array(WORD_LENGTH).fill('absent');
    const used = Array(WORD_LENGTH).fill(false);
    // First pass: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === targetWord[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }
    // Second pass: present
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < WORD_LENGTH; j++) {
        if (!used[j] && guess[i] === targetWord[j]) {
          result[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }
    return result;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-100 via-blue-100 to-yellow-100 p-6">
      {/* Tailwind CSS test element - remove after confirming Tailwind is loaded */}
      <div className="bg-red-500 text-white text-2xl p-2 rounded mb-2">TAILWIND TEST: If this is red, Tailwind is working!</div>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Word Guess 📝</h1>
        <p className="text-lg opacity-90">Guess the hidden word! (Wordle-style)</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        {loading ? (
          <div className="text-xl text-blue-600 font-semibold mb-4">Loading word...</div>
        ) : error ? (
          <div className="text-xl text-red-600 font-semibold mb-4">{error}</div>
        ) : (
          <div className="mb-4">
            {guesses.map((guess, idx) => {
              const status = getLetterStatus(guess, idx);
              return (
                <div key={idx} className="flex gap-1 justify-center mb-1">
                  {guess.split('').map((char, i) => (
                    <span
                      key={i}
                      className={`inline-block w-10 h-10 rounded-lg text-2xl font-bold flex items-center justify-center border-2
                        ${status[i] === 'correct' ? 'bg-green-500 text-white border-green-700' :
                          status[i] === 'present' ? 'bg-yellow-300 text-gray-900 border-yellow-600' :
                          'bg-gray-200 text-gray-700 border-gray-400'}`}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              );
            })}
            {gameStatus === 'playing' && guesses.length < MAX_ATTEMPTS && (
              <div className="flex flex-col items-center mb-1">
                <div className="flex gap-1 justify-center mb-2">
                  {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={currentGuess[i] || ''}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        if (/^[A-Z]?$/.test(val)) {
                          const newGuess = currentGuess.substring(0, i) + val + currentGuess.substring(i + 1);
                          setCurrentGuess(newGuess.slice(0, WORD_LENGTH));
                          // Auto-focus next input (Tab to next)
                          if (val && i < WORD_LENGTH - 1) {
                            const next = document.getElementById(`wg-input-${i + 1}`);
                            if (next) (next as HTMLInputElement).focus();
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && currentGuess.length === WORD_LENGTH && gameStatus === 'playing' && !loading) {
                          handleGuess();
                          e.preventDefault();
                          return;
                        }
                        if (e.key === 'Backspace' && !currentGuess[i] && i > 0) {
                          const prev = document.getElementById(`wg-input-${i - 1}`);
                          if (prev) (prev as HTMLInputElement).focus();
                        }
                        if (e.key === 'ArrowLeft' && i > 0) {
                          const prev = document.getElementById(`wg-input-${i - 1}`);
                          if (prev) (prev as HTMLInputElement).focus();
                        }
                        if (e.key === 'ArrowRight' && i < WORD_LENGTH - 1) {
                          const next = document.getElementById(`wg-input-${i + 1}`);
                          if (next) (next as HTMLInputElement).focus();
                        }
                        // Tab to next input on letter
                        if (/^[a-zA-Z]$/.test(e.key) && i < WORD_LENGTH - 1) {
                          setTimeout(() => {
                            const next = document.getElementById(`wg-input-${i + 1}`);
                            if (next) (next as HTMLInputElement).focus();
                          }, 0);
                        }
                      }}
                      id={`wg-input-${i}`}
                      autoComplete="off"
                      spellCheck={false}
                      className={`w-6 h-14 rounded-xl text-3xl font-black text-center border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow bg-white tracking-widest
                        ${currentGuess[i] ? 'border-blue-500 bg-blue-100 scale-105' : 'border-gray-300'}
                        ${gameStatus !== 'playing' || loading ? 'opacity-60' : 'hover:border-blue-400'}`}
                      disabled={gameStatus !== 'playing' || loading}
                      style={{
                        boxShadow: currentGuess[i] ? '0 0 0 2px #6366f1' : '0 1px 4px 0 rgba(0,0,0,0.08)',
                        letterSpacing: '0.1em',
                        marginRight: i < WORD_LENGTH - 1 ? '0.1rem' : 0
                      }}
                    />
                  ))}
                </div>
                <button
                  className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-2xl shadow text-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleGuess}
                  disabled={currentGuess.length !== WORD_LENGTH || loading}
                >Guess</button>
              </div>
            )}
          </div>
        )}
        {gameStatus === 'won' && !loading && (
          <div className="text-2xl font-bold text-green-600 mb-2">You guessed it! 🎉</div>
        )}
        {gameStatus === 'lost' && !loading && (
          <div className="text-2xl font-bold text-red-600 mb-2">Out of guesses! The word was <span className="underline">{targetWord}</span></div>
        )}
        <button
          onClick={handleRestart}
          className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow mt-4"
          disabled={loading}
        >New Word</button>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 📝</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Guess the word by entering letters</li>
          <li>• Each correct letter is revealed</li>
          <li>• Try to solve the word in as few guesses as possible!</li>
        </ul>
      </div>
      {/* Keyboard legend for letter status */}
      {!loading && !error && (
        <div className="flex flex-wrap justify-center gap-1 mb-4 mt-2 select-none">
          {(() => {
            // Build a map of letter status from all guesses
            const letterStatus: { [k: string]: 'correct' | 'present' | 'absent' | undefined } = {};
            guesses.forEach((guess, idx) => {
              const status = getLetterStatus(guess, idx);
              guess.split('').forEach((char, i) => {
                if (status[i] === 'correct') letterStatus[char] = 'correct';
                else if (status[i] === 'present' && letterStatus[char] !== 'correct') letterStatus[char] = 'present';
                else if (status[i] === 'absent' && !letterStatus[char]) letterStatus[char] = 'absent';
              });
            });
            return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
              <span
                key={l}
                className={`w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center border-2 mx-0.5 my-0.5
                  ${letterStatus[l] === 'correct' ? 'bg-green-500 text-white border-green-700' :
                    letterStatus[l] === 'present' ? 'bg-yellow-300 text-gray-900 border-yellow-600' :
                    letterStatus[l] === 'absent' ? 'bg-gray-300 text-gray-400 border-gray-400' :
                    'bg-white text-gray-500 border-gray-300'}`}
                style={{ minWidth: 32 }}
              >{l}</span>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

export default WordGuess;
