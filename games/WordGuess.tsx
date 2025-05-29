import React, { useState, useCallback } from 'react';

type GuessResult = {
  letter: string;
  status: 'correct' | 'present' | 'absent';
};

const WordGuess: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [maxGuesses] = useState(6);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const wordLists = {
    easy: [
      'HAPPY', 'SMILE', 'DANCE', 'MUSIC', 'BEACH', 'SUNNY', 'PLANT', 'HEART',
      'SWEET', 'LIGHT', 'MAGIC', 'PEACE', 'BRAVE', 'DREAM', 'GRACE', 'LAUGH',
      'STONE', 'RIVER', 'CLOUD', 'EARTH', 'STORM', 'FLAME', 'OCEAN', 'SWIFT'
    ],
    medium: [
      'PUZZLE', 'BRIGHT', 'JUNGLE', 'FRIEND', 'BASKET', 'GARDEN', 'TROPHY',
      'POCKET', 'BREEZE', 'FROZEN', 'GOLDEN', 'MOTHER', 'FATHER', 'KNIGHT',
      'CASTLE', 'BRIDGE', 'CHANGE', 'PICKLE', 'SPRING', 'BRANCH', 'FABRIC'
    ],
    hard: [
      'QUARTZ', 'OXYGEN', 'WHISPER', 'JOURNEY', 'COMPLEX', 'MYSTERY', 'QUANTUM',
      'HARMONY', 'RHYTHM', 'CRYSTAL', 'PYRAMID', 'PHOENIX', 'GALAXY', 'PRISM'
    ]
  };

  const selectRandomWord = useCallback(() => {
    const words = wordLists[difficulty];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setTargetWord(randomWord);
  }, [difficulty]);

  const startNewGame = useCallback(() => {
    selectRandomWord();
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
  }, [selectRandomWord]);

  React.useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const getGuessResult = (guess: string): GuessResult[] => {
    const result: GuessResult[] = [];
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');

    // First pass: mark correct positions
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        result[i] = { letter: guessLetters[i], status: 'correct' };
        targetLetters[i] = ''; // Mark as used
        guessLetters[i] = ''; // Mark as processed
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] !== '') {
        const targetIndex = targetLetters.indexOf(guessLetters[i]);
        if (targetIndex !== -1) {
          result[i] = { letter: guess[i], status: 'present' };
          targetLetters[targetIndex] = ''; // Mark as used
        } else {
          result[i] = { letter: guess[i], status: 'absent' };
        }
      }
    }

    return result;
  };

  const submitGuess = () => {
    if (currentGuess.length !== targetWord.length || gameOver) return;

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
    } else if (newGuesses.length >= maxGuesses) {
      setGameOver(true);
    }

    setCurrentGuess('');
  };

  const handleKeyPress = (letter: string) => {
    if (gameOver) return;

    if (letter === 'ENTER') {
      submitGuess();
    } else if (letter === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < targetWord.length && /^[A-Z]$/.test(letter)) {
      setCurrentGuess(prev => prev + letter);
    }
  };

  const getLetterStatus = (letter: string): 'correct' | 'present' | 'absent' | 'unused' => {
    for (const guess of guesses) {
      const result = getGuessResult(guess);
      const letterResult = result.find(r => r.letter === letter);
      if (letterResult) {
        if (letterResult.status === 'correct') return 'correct';
        if (letterResult.status === 'present') return 'present';
        if (letterResult.status === 'absent') return 'absent';
      }
    }
    return 'unused';
  };

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-100 via-blue-100 to-yellow-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Word Guess 📝</h1>
        <p className="text-lg opacity-90">Guess the hidden word! (Full game coming soon!)</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center text-2xl text-gray-500">
          Word Guess coming soon!<br />
          (A full-featured version is in development.)
        </div>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 📝</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Guess the word by entering letters</li>
          <li>• Each correct letter is revealed</li>
          <li>• Try to solve the word in as few guesses as possible!</li>
        </ul>
      </div>
    </div>
  );
};

export default WordGuess;
