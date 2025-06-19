import React, { useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

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
  const [hint, setHint] = useState<string>('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints] = useState(3);
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);

  // Fallback word lists in case AI is unavailable
  const fallbackWordLists = {
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

  const getAIWord = async () => {
    setLoadingWord(true);
    try {
      const difficultyDescriptions = {
        easy: '4-5 letter common words that are simple and familiar (like HAPPY, SMILE, MUSIC)',
        medium: '5-6 letter words that are moderately challenging (like PUZZLE, CASTLE, GARDEN)',
        hard: '6-7 letter complex or uncommon words (like QUARTZ, MYSTERY, QUANTUM)'
      };

      const systemPrompt = `You are a word generator for a word guessing game (like Wordle). 
      Generate a single word for ${difficulty} difficulty.
      
      Requirements:
      - ${difficultyDescriptions[difficulty]}
      - Must be a real English word
      - Must be appropriate for all ages
      - Must be exactly one word (no phrases or hyphenated words)
      - Must contain only letters A-Z
      - Respond with ONLY the word in uppercase, nothing else
      
      Examples for ${difficulty}: ${fallbackWordLists[difficulty].slice(0, 3).join(', ')}`;

      // Use the correct API format with history array like other games
      const history = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a single ${difficulty} difficulty word for the word guessing game.` }
      ];

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history }),
      });

      if (response.ok) {
        const data = await response.json();
        let aiWord = (data.message || '').trim().toUpperCase();
        
        // Clean the response to extract just the word
        aiWord = aiWord.replace(/[^A-Z]/g, '').trim();
        
        // Validate the word length based on difficulty
        const expectedLengths = {
          easy: [4, 5],
          medium: [5, 6],
          hard: [6, 7]
        };
        
        if (aiWord.length >= expectedLengths[difficulty][0] && 
            aiWord.length <= expectedLengths[difficulty][1] && 
            aiWord.length > 0) {
          setTargetWord(aiWord);
          console.log(`AI generated word: ${aiWord} (${difficulty})`);
        } else {
          throw new Error(`Invalid word length: ${aiWord.length}`);
        }
      } else {
        throw new Error('AI request failed');
      }
    } catch (error) {
      console.error('Error getting AI word:', error);
      // Fallback to predefined word list
      const words = fallbackWordLists[difficulty];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      setTargetWord(randomWord);
      console.log(`Using fallback word: ${randomWord} (${difficulty})`);
    } finally {
      setLoadingWord(false);
    }
  };

  const selectRandomWord = useCallback(() => {
    getAIWord();
  }, [difficulty]);

  const startNewGame = useCallback(async () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setHint('');
    setHintsUsed(0);
    await selectRandomWord();
  }, [selectRandomWord]);

  React.useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Add keyboard event listener
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (event.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        handleKeyPress(event.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, currentGuess, targetWord]);

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

  const getAIHint = async () => {
    if (hintsUsed >= maxHints || gameOver || !targetWord || loadingHint) return;
    
    setLoadingHint(true);
    try {
      // Prepare the game state for the AI
      const gameState = {
        targetWord,
        guesses,
        currentGuess,
        difficulty,
        hintsUsed,
        maxGuesses,
        guessesRemaining: maxGuesses - guesses.length
      };

      const systemPrompt = `You are a helpful assistant for a word guessing game (like Wordle). 
      The player is trying to guess a ${targetWord.length}-letter word: "${targetWord}".
      
      Game state:
      - Difficulty: ${difficulty}
      - Guesses made: ${guesses.length}/${maxGuesses}
      - Previous guesses: ${guesses.join(', ') || 'None'}
      - Hints used: ${hintsUsed}/${maxHints}
      
      Provide a helpful hint that gives the player a clue about the word without directly revealing it. 
      You can hint about:
      - The category or theme of the word
      - A synonym or related concept
      - The first letter or last letter
      - Number of vowels
      - A definition or description
      
      Keep the hint concise (1-2 sentences) and helpful but not too obvious.`;

      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'word-guess',
          state: gameState,
          systemPrompt: systemPrompt,
          userMessage: `Please give me a hint for the word "${targetWord}". This is hint ${hintsUsed + 1} of ${maxHints}.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHint(data.response || data.hint || 'Try thinking about common letter patterns!');
        setHintsUsed(prev => prev + 1);
      } else {
        // Fallback hints if AI is not available
        const fallbackHints = [
          `This word has ${targetWord.split('').filter(letter => 'AEIOU'.includes(letter)).length} vowel(s).`,
          `The word starts with the letter "${targetWord[0]}".`,
          `The word ends with the letter "${targetWord[targetWord.length - 1]}".`
        ];
        setHint(fallbackHints[hintsUsed] || 'Keep trying! You can do this!');
        setHintsUsed(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error getting AI hint:', error);
      // Fallback hint
      const fallbackHints = [
        `This word has ${targetWord.split('').filter(letter => 'AEIOU'.includes(letter)).length} vowel(s).`,
        `The word starts with "${targetWord[0]}".`,
        `The word ends with "${targetWord[targetWord.length - 1]}".`
      ];
      setHint(fallbackHints[hintsUsed] || 'Keep trying! You can do this!');
      setHintsUsed(prev => prev + 1);
    } finally {
      setLoadingHint(false);
    }
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
        <p className="text-lg opacity-90">Guess the hidden word!</p>
        
        {/* Difficulty selector */}
        <div className="mt-4 flex justify-center space-x-2">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                setHint('');
                setHintsUsed(0);
              }}
              className={`px-4 py-2 rounded-lg font-comic text-sm transition-colors ${
                difficulty === level
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hint Display */}
      {hint && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg max-w-lg mx-auto">
          <div className="flex items-center">
            <span className="text-2xl mr-2">💡</span>
            <div>
              <p className="text-blue-700 font-semibold">AI Hint:</p>
              <p className="text-blue-600">{hint}</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-lg mb-6">
        {loadingWord ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin text-4xl mb-4">🎯</div>
            <p className="text-lg font-semibold text-gray-600">AI is generating a new word...</p>
            <p className="text-sm text-gray-500 mt-2">Difficulty: {difficulty}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 mb-6">
              {Array.from({ length: maxGuesses }, (_, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 justify-center">
                  {Array.from({ length: targetWord.length }, (_, colIndex) => {
                    const guess = guesses[rowIndex];
                    const isCurrentRow = rowIndex === guesses.length && !gameOver;
                    const letter = isCurrentRow && currentGuess[colIndex] ? currentGuess[colIndex] : (guess ? guess[colIndex] : '');
                    const result = guess ? getGuessResult(guess)[colIndex] : null;
                    
                    let bgColor = 'bg-gray-100 border-gray-300';
                    if (result) {
                      switch (result.status) {
                        case 'correct':
                          bgColor = 'bg-green-500 text-white border-green-500';
                          break;
                        case 'present':
                          bgColor = 'bg-yellow-500 text-white border-yellow-500';
                          break;
                        case 'absent':
                          bgColor = 'bg-gray-400 text-white border-gray-400';
                          break;
                      }
                    } else if (isCurrentRow && currentGuess[colIndex]) {
                      bgColor = 'bg-blue-100 border-blue-300';
                    }
                    
                    return (
                      <div
                        key={colIndex}
                        className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center font-bold text-lg ${bgColor}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Game Status */}
            {gameOver && (
              <div className="text-center mb-4">
                {won ? (
                  <div className="text-green-600 font-bold text-xl">
                    🎉 Congratulations! You won! 🎉
                  </div>
                ) : (
                  <div className="text-red-600 font-bold text-xl">
                    😔 Game Over! The word was: <span className="text-primary-600">{targetWord}</span>
                  </div>
                )}
              </div>
            )}

            {/* Virtual Keyboard */}
            <div className="space-y-2">
              {keyboard.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.map((key) => {
                    const status = key.length === 1 ? getLetterStatus(key) : 'unused';
                    let keyClass = 'px-3 py-2 rounded font-bold text-sm transition-colors ';
                    
                    if (key === 'ENTER' || key === 'BACKSPACE') {
                      keyClass += 'bg-gray-500 text-white hover:bg-gray-600 px-4';
                    } else {
                      switch (status) {
                        case 'correct':
                          keyClass += 'bg-green-500 text-white';
                          break;
                        case 'present':
                          keyClass += 'bg-yellow-500 text-white';
                          break;
                        case 'absent':
                          keyClass += 'bg-gray-400 text-white';
                          break;
                        default:
                          keyClass += 'bg-gray-200 text-gray-800 hover:bg-gray-300';
                      }
                    }
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        disabled={gameOver}
                        className={keyClass}
                      >
                        {key === 'BACKSPACE' ? '⌫' : key}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <button
            onClick={getAIHint}
            disabled={gameOver || hintsUsed >= maxHints || loadingHint || loadingWord || !targetWord}
            className={`px-6 py-2 rounded-lg font-comic transition-colors flex items-center gap-2 ${
              gameOver || hintsUsed >= maxHints || loadingHint || loadingWord || !targetWord
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loadingHint ? (
              <>
                <span className="animate-spin">🤔</span>
                Thinking...
              </>
            ) : (
              <>
                💡 Get AI Hint ({hintsUsed}/{maxHints})
              </>
            )}
          </button>
          <button
            onClick={startNewGame}
            disabled={loadingWord}
            className={`px-6 py-2 rounded-lg font-comic transition-colors flex items-center gap-2 ${
              loadingWord
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {loadingWord ? (
              <>
                <span className="animate-spin">🎯</span>
                Generating...
              </>
            ) : (
              'New Game'
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 📝</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Guess the {targetWord.length}-letter word in {maxGuesses} tries</li>
          <li>• 🟩 Green = correct letter in correct position</li>
          <li>• 🟨 Yellow = correct letter in wrong position</li>
          <li>• ⬜ Gray = letter not in the word</li>
        </ul>
      </div>
    </div>
  );
};

export default WordGuess;
