import React from 'react';
import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'number' | 'color' | 'pattern' | 'logic';

interface CodeBreakerState {
  gameMode: GameMode;
  difficulty: Difficulty;
  secretCode: string[];
  userGuess: string[];
  attempts: number;
  maxAttempts: number;
  guessHistory: Array<{
    guess: string[];
    feedback: string;
  }>;
  gameWon: boolean;
  gameLost: boolean;
  score: number;
  totalScore: number;
  streak: number;
  bestStreak: number;
  loading: boolean;
  hint: string;
  hintsUsed: number;
}

const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];
const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const PATTERNS = ['⭐', '❤️', '💎', '🌟', '⚡', '🎈'];

const FALLBACK_LOGIC_PUZZLES = {
  easy: [
    { code: ['A', 'B', 'C'], hint: "Follow the alphabet order", description: "Three letters in alphabetical order" },
    { code: ['1', '2', '3'], hint: "Count up from 1", description: "Three numbers in sequence" },
    { code: ['🔴', '🔴', '🔴'], hint: "All the same color", description: "Three identical items" }
  ],
  medium: [
    { code: ['1', '3', '5'], hint: "Skip one number each time", description: "Odd numbers in sequence" },
    { code: ['A', 'C', 'E'], hint: "Skip one letter each time", description: "Every other letter" },
    { code: ['🔴', '🟡', '🔴'], hint: "Red, yellow, red pattern", description: "Alternating colors" }
  ],
  hard: [
    { code: ['2', '4', '8'], hint: "Each number doubles", description: "Powers of 2" },
    { code: ['Z', 'Y', 'X'], hint: "Backwards alphabet", description: "Reverse alphabetical order" },
    { code: ['🔴', '🟡', '🟢'], hint: "Traffic light colors", description: "Follow traffic light sequence" }
  ]
};

export default function CodeBreaker() {
  const [state, setState] = useState<CodeBreakerState>({
    gameMode: 'number',
    difficulty: 'easy',
    secretCode: [],
    userGuess: [],
    attempts: 0,
    maxAttempts: 10,
    guessHistory: [],
    gameWon: false,
    gameLost: false,
    score: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    loading: false,
    hint: '',
    hintsUsed: 0,
  });

  useEffect(() => {
    const savedScore = localStorage.getItem('codebreaker-total-score');
    const savedStreak = localStorage.getItem('codebreaker-best-streak');
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
    if (savedStreak) {
      setState(prev => ({ ...prev, bestStreak: parseInt(savedStreak, 10) }));
    }
  }, []);

  useEffect(() => {
    generateNewCode();
  }, [state.gameMode, state.difficulty]);

  const getCodeLength = () => {
    return state.difficulty === 'easy' ? 3 : state.difficulty === 'medium' ? 4 : 5;
  };

  const getMaxAttempts = () => {
    return state.difficulty === 'easy' ? 8 : state.difficulty === 'medium' ? 10 : 12;
  };

  const generateNewCode = async () => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      attempts: 0, 
      guessHistory: [], 
      gameWon: false, 
      gameLost: false, 
      userGuess: [], 
      hint: '',
      hintsUsed: 0,
      maxAttempts: getMaxAttempts()
    }));

    const codeLength = getCodeLength();
    let newCode: string[] = [];
    let newHint = '';

    if (state.gameMode === 'logic') {
      try {
        const response = await fetch('/api/ask-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            history: [
              {
                role: 'user',
                content: `Create a ${state.difficulty} difficulty logic puzzle for kids. Generate a sequence of ${codeLength} items (letters, numbers, or simple patterns) that follows a logical rule. Return a JSON object with:
                {
                  "code": ["item1", "item2", "item3"],
                  "hint": "a helpful hint about the pattern",
                  "description": "what the pattern represents"
                }
                Make it age-appropriate and fun!`
              }
            ]
          }),
        });

        const data = await response.json();
        let puzzleData = null;
        
        if (data.message) {
          try {
            let cleanMessage = data.message.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
            puzzleData = JSON.parse(cleanMessage);
          } catch {
            const codeMatch = data.message.match(/code['":].*?\[([^\]]+)\]/i);
            const hintMatch = data.message.match(/hint['":].*?['"]([^'"]+)['"]/i);
            
            if (codeMatch && hintMatch) {
              const codeItems = codeMatch[1].split(',').map((item: string) => item.trim().replace(/['"]/g, ''));
              puzzleData = {
                code: codeItems,
                hint: hintMatch[1]
              };
            }
          }
        } else if (data.response) {
          try {
            let cleanResponse = data.response.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
            puzzleData = JSON.parse(cleanResponse);
          } catch {
            const codeMatch = data.response.match(/code['":].*?\[([^\]]+)\]/i);
            const hintMatch = data.response.match(/hint['":].*?['"]([^'"]+)['"]/i);
            
            if (codeMatch && hintMatch) {
              const codeItems = codeMatch[1].split(',').map((item: string) => item.trim().replace(/['"]/g, ''));
              puzzleData = {
                code: codeItems,
                hint: hintMatch[1]
              };
            }
          }
        }
        
        if (puzzleData && puzzleData.code && puzzleData.code.length === codeLength) {
          newCode = puzzleData.code;
          newHint = puzzleData.hint || "Look for the pattern!";
        } else {
          throw new Error('Invalid puzzle format');
        }
      } catch (error) {
        console.error('Failed to generate logic puzzle:', error);
        const fallbackPuzzles = FALLBACK_LOGIC_PUZZLES[state.difficulty];
        const randomPuzzle = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
        newCode = randomPuzzle.code;
        newHint = randomPuzzle.hint;
      }
    } else {
      // Generate random codes for other modes
      const options = state.gameMode === 'color' ? COLORS : 
                    state.gameMode === 'pattern' ? PATTERNS : NUMBERS;
      
      for (let i = 0; i < codeLength; i++) {
        newCode.push(options[Math.floor(Math.random() * options.length)]);
      }
      
      newHint = state.gameMode === 'number' ? "Try different number combinations" :
                state.gameMode === 'color' ? "Think about color combinations" :
                "Look for pattern combinations";
    }

    setState(prev => ({
      ...prev,
      secretCode: newCode,
      hint: newHint,
      userGuess: new Array(codeLength).fill(''),
      loading: false,
    }));
  };

  const getAvailableOptions = () => {
    switch (state.gameMode) {
      case 'color': return COLORS;
      case 'pattern': return PATTERNS;
      case 'number': return NUMBERS.slice(0, state.difficulty === 'easy' ? 6 : state.difficulty === 'medium' ? 8 : 9);
      case 'logic': return NUMBERS.concat(['A', 'B', 'C', 'D', 'E']).concat(COLORS.slice(0, 3));
      default: return NUMBERS;
    }
  };

  const updateGuess = (index: number, value: string) => {
    const newGuess = [...state.userGuess];
    newGuess[index] = value;
    setState(prev => ({ ...prev, userGuess: newGuess }));
  };

  const submitGuess = () => {
    if (state.userGuess.some(item => !item)) return;

    const feedback = generateFeedback(state.userGuess, state.secretCode);
    const newHistory = [...state.guessHistory, { guess: [...state.userGuess], feedback }];
    const newAttempts = state.attempts + 1;
    
    const isWin = state.userGuess.every((item, index) => item === state.secretCode[index]);
    const isLoss = !isWin && newAttempts >= state.maxAttempts;

    if (isWin) {
      const basePoints = state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 15 : 20;
      const attemptBonus = Math.max(0, (state.maxAttempts - newAttempts) * 2);
      const hintPenalty = state.hintsUsed * 3;
      const points = Math.max(basePoints + attemptBonus - hintPenalty, 1);
      
      const newScore = state.score + points;
      const newTotalScore = state.totalScore + points;
      const newStreak = state.streak + 1;
      const newBestStreak = Math.max(state.bestStreak, newStreak);
      
      setState(prev => ({
        ...prev,
        attempts: newAttempts,
        guessHistory: newHistory,
        gameWon: true,
        score: newScore,
        totalScore: newTotalScore,
        streak: newStreak,
        bestStreak: newBestStreak,
      }));
      
      localStorage.setItem('codebreaker-total-score', newTotalScore.toString());
      localStorage.setItem('codebreaker-best-streak', newBestStreak.toString());
    } else {
      setState(prev => ({
        ...prev,
        attempts: newAttempts,
        guessHistory: newHistory,
        gameLost: isLoss,
        streak: isLoss ? 0 : prev.streak,
        userGuess: new Array(state.secretCode.length).fill(''),
      }));
    }
  };

  const generateFeedback = (guess: string[], secret: string[]): string => {
    let correct = 0;
    let misplaced = 0;
    
    const secretCopy = [...secret];
    const guessCopy = [...guess];
    
    // Check for correct positions
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === secret[i]) {
        correct++;
        secretCopy[i] = '';
        guessCopy[i] = '';
      }
    }
    
    // Check for correct items in wrong positions
    for (let i = 0; i < guessCopy.length; i++) {
      if (guessCopy[i] && secretCopy.includes(guessCopy[i])) {
        misplaced++;
        const index = secretCopy.indexOf(guessCopy[i]);
        secretCopy[index] = '';
      }
    }
    
    return `✅ ${correct} correct, 🟡 ${misplaced} misplaced`;
  };

  const useHint = () => {
    setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  };

  const handleModeChange = (mode: GameMode) => {
    setState(prev => ({ ...prev, gameMode: mode, score: 0 }));
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setState(prev => ({ ...prev, difficulty, score: 0 }));
  };

  const resetStats = () => {
    setState(prev => ({ ...prev, totalScore: 0, bestStreak: 0 }));
    localStorage.removeItem('codebreaker-total-score');
    localStorage.removeItem('codebreaker-best-streak');
  };

  const options = getAvailableOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            🔐 Code Breaker
          </h1>
          
          <div className="flex justify-center gap-2 mb-4">
            {(['number', 'color', 'pattern', 'logic'] as GameMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-2 rounded-lg capitalize font-semibold transition-all text-sm ${
                  state.gameMode === mode
                    ? 'bg-cyan-500 text-black shadow-lg'
                    : 'bg-gray-600 text-white hover:bg-gray-500'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-4 py-2 rounded-lg capitalize font-semibold transition-all ${
                  state.difficulty === level
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-600 text-white hover:bg-gray-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6 text-lg">
            <div>Session: <span className="font-bold text-cyan-400">{state.score}</span></div>
            <div>Total: <span className="font-bold text-green-400">{state.totalScore}</span></div>
            <div>Streak: <span className="font-bold text-blue-400">{state.streak}</span></div>
            <div>Best: <span className="font-bold text-purple-400">{state.bestStreak}</span></div>
          </div>
          
          <button
            onClick={resetStats}
            className="text-sm text-red-400 hover:text-red-300 underline mt-2"
          >
            Reset Stats
          </button>
        </div>

        {state.loading ? (
          <div className="text-center py-12">
            <div className="text-2xl mb-4">🔄 Generating new code...</div>
            <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-lg mb-2">
                Crack the {getCodeLength()}-{state.gameMode === 'logic' ? 'item logic puzzle' : `${state.gameMode} code`}!
              </div>
              <div className="text-sm text-gray-300">
                Attempts: {state.attempts}/{state.maxAttempts}
              </div>
            </div>

            {!state.gameWon && !state.gameLost && (
              <div className="mb-6">
                <div className="flex justify-center gap-2 mb-4">
                  {state.userGuess.map((item, index) => (
                    <select
                      key={index}
                      value={item}
                      onChange={(e) => updateGuess(index, e.target.value)}
                      className="w-16 h-16 text-2xl text-center text-black rounded-lg border-2 border-gray-300 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="">?</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={submitGuess}
                    disabled={state.userGuess.some(item => !item)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Guess
                  </button>
                  
                  {state.gameMode === 'logic' && state.hintsUsed === 0 && (
                    <button
                      onClick={useHint}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                    >
                      Get Hint 💡
                    </button>
                  )}
                </div>

                {state.hintsUsed > 0 && state.gameMode === 'logic' && (
                  <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-4 text-center">
                    <strong>Hint:</strong> {state.hint}
                  </div>
                )}
              </div>
            )}

            {state.guessHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-center">Previous Guesses</h3>
                <div className="space-y-2">
                  {state.guessHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800 bg-opacity-50 rounded-lg p-3">
                      <div className="flex gap-2">
                        {entry.guess.map((item, i) => (
                          <div key={i} className="w-10 h-10 bg-gray-700 rounded text-center flex items-center justify-center">
                            {item}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm">{entry.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(state.gameWon || state.gameLost) && (
              <div className="text-center space-y-4">
                <div className={`text-3xl font-bold ${state.gameWon ? 'text-green-400' : 'text-red-400'}`}>
                  {state.gameWon ? '🎉 Code Cracked!' : '💥 Code Unbroken!'}
                </div>
                
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="text-lg mb-2">
                    <strong>The code was:</strong>
                  </div>
                  <div className="flex justify-center gap-2 mb-4">
                    {state.secretCode.map((item, index) => (
                      <div key={index} className="w-12 h-12 bg-yellow-500 text-black rounded text-center flex items-center justify-center text-lg font-bold">
                        {item}
                      </div>
                    ))}
                  </div>
                  {state.gameWon && (
                    <div className="text-sm text-green-300">
                      Solved in {state.attempts} attempts!
                      {state.hintsUsed > 0 && ` (${state.hintsUsed * 3} points deducted for hints)`}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={generateNewCode}
                  className="px-8 py-3 bg-purple-500 text-white rounded-lg text-xl font-semibold hover:bg-purple-600"
                >
                  New Code ➡️
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="instructions mt-8 bg-gradient-to-r from-cyan-900 to-blue-900 bg-opacity-50 p-6 rounded-lg shadow-lg border border-cyan-400">
          <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center">
            <span className="mr-2">🔓</span>
            How to Play Code Breaker
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">🎯 Game Modes</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Number:</strong> Crack numeric sequences</li>
                <li>• <strong>Color:</strong> Decode color patterns</li>
                <li>• <strong>Pattern:</strong> Solve symbol combinations</li>
                <li>• <strong>Logic:</strong> Mixed letters, numbers & colors</li>
              </ul>
              
              <h4 className="font-semibold text-cyan-400 mb-2 mt-3">🎮 Difficulty</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Easy:</strong> 3-4 positions, 8 attempts</li>
                <li>• <strong>Medium:</strong> 4-5 positions, 10 attempts</li>
                <li>• <strong>Hard:</strong> 5-6 positions, 12 attempts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">⚡ Feedback System</h4>
              <ul className="text-sm space-y-1">
                <li>• <span className="text-green-400">●</span> Correct position & value</li>
                <li>• <span className="text-yellow-400">●</span> Correct value, wrong position</li>
                <li>• <span className="text-red-400">●</span> Value not in code</li>
              </ul>
              
              <h4 className="font-semibold text-cyan-400 mb-2 mt-3">🏆 Scoring</h4>
              <ul className="text-sm space-y-1">
                <li>• Faster solutions = more points</li>
                <li>• Hints cost 3 points each</li>
                <li>• Bonus for unused attempts</li>
                <li>• Streak bonuses for consecutive wins</li>
              </ul>
              
              <h4 className="font-semibold text-cyan-400 mb-2 mt-3">💡 Tips</h4>
              <ul className="text-sm space-y-1">
                <li>• Use process of elimination</li>
                <li>• Pay attention to feedback colors</li>
                <li>• Try different positions for yellow dots</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
