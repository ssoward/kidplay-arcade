'use client';

import { useState, useEffect, useCallback } from 'react';

type Operation = '+' | '-' | '×' | '÷';
type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'practice' | 'timed' | 'streak';

interface Question {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

interface GameStats {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  totalScore: number;
}

interface QuickMathState {
  gameMode: GameMode;
  difficulty: Difficulty;
  operations: Operation[];
  currentQuestion: Question | null;
  userAnswer: string;
  gameActive: boolean;
  timeLeft: number;
  stats: GameStats;
  feedback: string;
  showFeedback: boolean;
  questionStartTime: number;
  gameStartTime: number;
  questionHistory: Array<{
    question: Question;
    userAnswer: number;
    correct: boolean;
    timeToAnswer: number;
  }>;
}

const GAME_DURATION = 60; // seconds for timed mode
const STREAK_TARGET = 10; // target streak for streak mode

export default function QuickMath() {
  const [state, setState] = useState<QuickMathState>({
    gameMode: 'practice',
    difficulty: 'easy',
    operations: ['+', '-'],
    currentQuestion: null,
    userAnswer: '',
    gameActive: false,
    timeLeft: GAME_DURATION,
    stats: {
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
      totalScore: 0,
    },
    feedback: '',
    showFeedback: false,
    questionStartTime: 0,
    gameStartTime: 0,
    questionHistory: [],
  });

  // Load saved stats
  useEffect(() => {
    const savedStats = localStorage.getItem('quickmath-stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setState(prev => ({
        ...prev,
        stats: { ...prev.stats, ...parsed }
      }));
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats: GameStats) => {
    localStorage.setItem('quickmath-stats', JSON.stringify({
      bestStreak: newStats.bestStreak,
      totalScore: newStats.totalScore,
    }));
  }, []);

  // Generate a random question based on difficulty and operations
  const generateQuestion = useCallback((): Question => {
    const operation = state.operations[Math.floor(Math.random() * state.operations.length)];
    let num1: number, num2: number, answer: number;

    // Handle division separately since it requires special logic
    if (operation === '÷') {
      switch (state.difficulty) {
        case 'easy':
          num2 = Math.floor(Math.random() * 10) + 1;
          answer = Math.floor(Math.random() * 10) + 1;
          num1 = num2 * answer;
          break;
        case 'medium':
          num2 = Math.floor(Math.random() * 20) + 1;
          answer = Math.floor(Math.random() * 20) + 1;
          num1 = num2 * answer;
          break;
        case 'hard':
          num2 = Math.floor(Math.random() * 50) + 1;
          answer = Math.floor(Math.random() * 50) + 1;
          num1 = num2 * answer;
          break;
      }
    } else {
      // Handle other operations
      switch (state.difficulty) {
        case 'easy':
          if (operation === '+' || operation === '-') {
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
          } else { // multiplication
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
          }
          break;
        case 'medium':
          if (operation === '+' || operation === '-') {
            num1 = Math.floor(Math.random() * 100) + 1;
            num2 = Math.floor(Math.random() * 100) + 1;
          } else { // multiplication
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
          }
          break;
        case 'hard':
          if (operation === '+' || operation === '-') {
            num1 = Math.floor(Math.random() * 500) + 1;
            num2 = Math.floor(Math.random() * 500) + 1;
          } else { // multiplication
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
          }
          break;
      }

      // Calculate answer for non-division operations
      switch (operation) {
        case '+':
          answer = num1 + num2;
          break;
        case '-':
          // Ensure positive result for subtraction
          if (num1 < num2) [num1, num2] = [num2, num1];
          answer = num1 - num2;
          break;
        case '×':
          answer = num1 * num2;
          break;
      }
    }

    return { num1, num2, operation, answer };
  }, [state.difficulty, state.operations]);

  // Start a new question
  const startNewQuestion = useCallback(() => {
    const question = generateQuestion();
    setState(prev => ({
      ...prev,
      currentQuestion: question,
      userAnswer: '',
      showFeedback: false,
      questionStartTime: Date.now(),
    }));
  }, [generateQuestion]);

  // Timer for timed mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.gameActive && state.gameMode === 'timed' && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            return {
              ...prev,
              timeLeft: 0,
              gameActive: false,
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.gameActive, state.gameMode, state.timeLeft]);

  // Start game
  const startGame = () => {
    const newStats: GameStats = {
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: state.stats.bestStreak,
      totalScore: state.stats.totalScore,
    };

    setState(prev => ({
      ...prev,
      gameActive: true,
      timeLeft: GAME_DURATION,
      stats: newStats,
      questionHistory: [],
      gameStartTime: Date.now(),
    }));

    startNewQuestion();
  };

  // End game
  const endGame = () => {
    setState(prev => {
      const updatedStats = {
        ...prev.stats,
        bestStreak: Math.max(prev.stats.bestStreak, prev.stats.streak),
        totalScore: prev.stats.totalScore + prev.stats.correct,
      };
      saveStats(updatedStats);
      
      return {
        ...prev,
        gameActive: false,
        stats: updatedStats,
      };
    });
  };

  // Check answer
  const checkAnswer = () => {
    if (!state.currentQuestion || state.userAnswer === '') return;

    const userNum = parseInt(state.userAnswer);
    const correct = userNum === state.currentQuestion.answer;
    const timeToAnswer = Date.now() - state.questionStartTime;

    setState(prev => {
      const newStats = {
        ...prev.stats,
        correct: correct ? prev.stats.correct + 1 : prev.stats.correct,
        incorrect: correct ? prev.stats.incorrect : prev.stats.incorrect + 1,
        streak: correct ? prev.stats.streak + 1 : 0,
      };

      const newHistory = [...prev.questionHistory, {
        question: prev.currentQuestion!,
        userAnswer: userNum,
        correct,
        timeToAnswer,
      }];

      return {
        ...prev,
        stats: newStats,
        questionHistory: newHistory,
        feedback: correct ? 'Correct! 🎉' : `Wrong! The answer was ${prev.currentQuestion!.answer}`,
        showFeedback: true,
      };
    });

    // Move to next question or end game
    setTimeout(() => {
      setState(prev => {
        // Check win conditions
        if (prev.gameMode === 'streak' && prev.stats.streak >= STREAK_TARGET) {
          return { ...prev, gameActive: false };
        }
        
        if (prev.gameMode === 'timed' && prev.timeLeft <= 0) {
          return { ...prev, gameActive: false };
        }

        return prev;
      });

      if (state.gameActive) {
        startNewQuestion();
      }
    }, 1500);
  };

  // Handle answer input
  const handleAnswerChange = (value: string) => {
    setState(prev => ({ ...prev, userAnswer: value }));
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.userAnswer !== '') {
      checkAnswer();
    }
  };

  // Toggle operation
  const toggleOperation = (op: Operation) => {
    setState(prev => {
      const newOps = prev.operations.includes(op)
        ? prev.operations.filter(o => o !== op)
        : [...prev.operations, op];
      
      return {
        ...prev,
        operations: newOps.length > 0 ? newOps : prev.operations // Keep at least one operation
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    if (state.stats.streak >= 5) return 'text-green-600';
    if (state.stats.streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="quick-math-game p-6 max-w-4xl mx-auto">
      <div className="header mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">Quick Math</h1>
        <p className="text-gray-600">Test your mental math skills!</p>
      </div>

      {!state.gameActive ? (
        <div className="setup-screen space-y-6">
          {/* Game Mode Selection */}
          <div className="game-mode-selection">
            <h3 className="text-xl font-semibold mb-3">Game Mode</h3>
            <div className="flex gap-3">
              {[
                { mode: 'practice' as GameMode, label: 'Practice', desc: 'No time limit' },
                { mode: 'timed' as GameMode, label: 'Timed', desc: '60 seconds' },
                { mode: 'streak' as GameMode, label: 'Streak', desc: 'Get 10 in a row' },
              ].map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => setState(prev => ({ ...prev, gameMode: mode }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    state.gameMode === mode
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="difficulty-selection">
            <h3 className="text-xl font-semibold mb-3">Difficulty</h3>
            <div className="flex gap-3">
              {[
                { diff: 'easy' as Difficulty, label: 'Easy', desc: 'Numbers 1-20' },
                { diff: 'medium' as Difficulty, label: 'Medium', desc: 'Numbers 1-100' },
                { diff: 'hard' as Difficulty, label: 'Hard', desc: 'Numbers 1-500' },
              ].map(({ diff, label, desc }) => (
                <button
                  key={diff}
                  onClick={() => setState(prev => ({ ...prev, difficulty: diff }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    state.difficulty === diff
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Operations Selection */}
          <div className="operations-selection">
            <h3 className="text-xl font-semibold mb-3">Operations</h3>
            <div className="flex gap-3">
              {[
                { op: '+' as Operation, label: 'Addition' },
                { op: '-' as Operation, label: 'Subtraction' },
                { op: '×' as Operation, label: 'Multiplication' },
                { op: '÷' as Operation, label: 'Division' },
              ].map(({ op, label }) => (
                <button
                  key={op}
                  onClick={() => toggleOperation(op)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    state.operations.includes(op)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl font-bold">{op}</div>
                  <div className="text-sm">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Display */}
          <div className="stats-display bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{state.stats.bestStreak}</div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{state.stats.totalScore}</div>
                <div className="text-sm text-gray-600">Total Correct</div>
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={state.operations.length === 0}
            className="w-full py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="game-screen">
          {/* Game Header */}
          <div className="game-header flex justify-between items-center mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="stats flex gap-6">
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor()}`}>
                  {state.stats.streak}
                </div>
                <div className="text-sm text-gray-600">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {state.stats.correct}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  {state.stats.incorrect}
                </div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
            </div>

            <div className="game-info text-right">
              {state.gameMode === 'timed' && (
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(state.timeLeft)}
                </div>
              )}
              {state.gameMode === 'streak' && (
                <div className="text-lg">
                  <span className="text-2xl font-bold text-purple-600">
                    {state.stats.streak}
                  </span>
                  <span className="text-gray-600"> / {STREAK_TARGET}</span>
                </div>
              )}
              <button
                onClick={endGame}
                className="mt-2 px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                End Game
              </button>
            </div>
          </div>

          {/* Question Display */}
          {state.currentQuestion && (
            <div className="question-display text-center mb-8">
              <div className="text-6xl font-bold text-gray-800 mb-6">
                {state.currentQuestion.num1} {state.currentQuestion.operation} {state.currentQuestion.num2} = ?
              </div>

              <div className="answer-input mb-4">
                <input
                  type="number"
                  value={state.userAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-4xl text-center p-4 border-2 border-gray-300 rounded-lg w-48 focus:border-blue-500 focus:outline-none"
                  placeholder="?"
                  autoFocus
                />
              </div>

              <button
                onClick={checkAnswer}
                disabled={state.userAnswer === ''}
                className="px-8 py-3 bg-green-600 text-white text-xl font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>

              {state.showFeedback && (
                <div className={`mt-4 text-2xl font-bold ${
                  state.feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {state.feedback}
                </div>
              )}
            </div>
          )}

          {/* Progress indicator for streak mode */}
          {state.gameMode === 'streak' && (
            <div className="progress-bar mb-4">
              <div className="bg-gray-200 rounded-full h-4">
                <div
                  className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(state.stats.streak / STREAK_TARGET) * 100}%` }}
                ></div>
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {state.stats.streak} / {STREAK_TARGET} correct in a row
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {!state.gameActive && state.questionHistory.length > 0 && (
        <div className="game-over mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Game Over!</h2>
          
          <div className="results grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{state.stats.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{state.stats.incorrect}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{state.stats.streak}</div>
              <div className="text-sm text-gray-600">Final Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {state.questionHistory.length > 0 
                  ? Math.round((state.stats.correct / state.questionHistory.length) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>

          {state.stats.streak >= STREAK_TARGET && (
            <div className="achievement text-center mb-4">
              <div className="text-4xl">🏆</div>
              <div className="text-xl font-bold text-yellow-600">
                Streak Master! You got {STREAK_TARGET} in a row!
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setState(prev => ({ 
                ...prev, 
                questionHistory: [],
                stats: {
                  ...prev.stats,
                  correct: 0,
                  incorrect: 0,
                  streak: 0,
                }
              }))}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}