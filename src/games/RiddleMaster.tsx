import React from 'react';
import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface RiddleState {
  riddle: string;
  answer: string;
  userAnswer: string;
  showAnswer: boolean;
  score: number;
  totalScore: number;
  hintsUsed: number;
  hint1: string;
  hint2: string;
  difficulty: Difficulty;
  loading: boolean;
  streak: number;
  bestStreak: number;
}

const FALLBACK_RIDDLES = {
  easy: [
    { riddle: "What has keys but no locks, space but no room, and you can enter but not go inside?", answer: "A keyboard", hint1: "You use it with computers", hint2: "It has letters and numbers" },
    { riddle: "What gets wet while drying?", answer: "A towel", hint1: "You use it after a shower", hint2: "It absorbs water" },
    { riddle: "What has hands but cannot clap?", answer: "A clock", hint1: "It tells you something important", hint2: "You look at it to know the time" }
  ],
  medium: [
    { riddle: "What can travel around the world while staying in a corner?", answer: "A stamp", hint1: "It's small and square", hint2: "You put it on letters" },
    { riddle: "What has cities, but no houses; forests, but no trees; and water, but no fish?", answer: "A map", hint1: "It shows places", hint2: "You use it for directions" },
    { riddle: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "The letter M", hint1: "Think about spelling", hint2: "Count the letters in each word" }
  ],
  hard: [
    { riddle: "What has a golden head and a golden tail, but no body?", answer: "A coin", hint1: "It has value", hint2: "You use it to buy things" },
    { riddle: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?", answer: "A river", hint1: "It flows", hint2: "Fish live in it" },
    { riddle: "What gets sharper the more you use it?", answer: "Your brain", hint1: "It's part of your body", hint2: "Learning makes it better" }
  ]
};

export default function RiddleMaster() {
  const [state, setState] = useState<RiddleState>({
    riddle: '',
    answer: '',
    userAnswer: '',
    showAnswer: false,
    score: 0,
    totalScore: 0,
    hintsUsed: 0,
    hint1: '',
    hint2: '',
    difficulty: 'easy',
    loading: false,
    streak: 0,
    bestStreak: 0,
  });

  // Levenshtein distance function for fuzzy matching
  const levenshtein = (a: string, b: string): number => {
    const m = a.length;
    const n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  };

  // Fuzzy matching function for riddle answers
  const isFuzzyMatch = (guess: string, answer: string): boolean => {
    const g = guess.trim().toLowerCase();
    const a = answer.trim().toLowerCase();
    if (!g || !a) return false;
    if (g === a) return true;
    
    // Allow for small Levenshtein distance (1 for short, 2 for longer)
    const maxDist = a.length > 6 ? 2 : 1;
    if (levenshtein(g, a) <= maxDist) return true;
    
    // Allow if guess is substring of answer or vice versa
    if (a.includes(g) || g.includes(a)) return true;
    
    // Allow if all words in guess are in answer (subset matching)
    const gWords = g.split(/\s+/).filter(word => word.length > 0);
    const aWords = a.split(/\s+/).filter(word => word.length > 0);
    
    // If guess has all words from answer (missing words are OK)
    if (gWords.every(word => aWords.some(aWord => 
      aWord.includes(word) || word.includes(aWord) || levenshtein(word, aWord) <= 1
    ))) return true;
    
    // If answer has all words from guess (extra words in answer are OK)
    if (aWords.every(word => gWords.some(gWord => 
      gWord.includes(word) || word.includes(gWord) || levenshtein(word, gWord) <= 1
    ))) return true;
    
    return false;
  };

  useEffect(() => {
    const savedScore = localStorage.getItem('riddlemaster-total-score');
    const savedStreak = localStorage.getItem('riddlemaster-best-streak');
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
    if (savedStreak) {
      setState(prev => ({ ...prev, bestStreak: parseInt(savedStreak, 10) }));
    }
  }, []);

  useEffect(() => {
    generateNewRiddle();
  }, [state.difficulty]);

  const generateNewRiddle = async () => {
    setState(prev => ({ ...prev, loading: true, userAnswer: '', showAnswer: false, hintsUsed: 0 }));
    
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
              content: `Generate a creative ${state.difficulty} difficulty riddle suitable for kids. Return a JSON object with:
              {
                "riddle": "the riddle question",
                "answer": "the answer",
                "hint1": "a subtle hint",
                "hint2": "a more obvious hint"
              }
              Make it fun and age-appropriate!`
            }
          ]
        }),
      });

      const data = await response.json();
      let riddleData: any = null;
      
      if (data.message) {
        try {
          // Remove markdown code blocks if present
          let cleanMessage = data.message.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          riddleData = JSON.parse(cleanMessage);
        } catch {
          // If JSON parsing fails, try to extract from text
          const riddleMatch = data.message.match(/riddle['":].*?['"]([^'"]+)['"]/i);
          const answerMatch = data.message.match(/answer['":].*?['"]([^'"]+)['"]/i);
          const hint1Match = data.message.match(/hint1['":].*?['"]([^'"]+)['"]/i);
          const hint2Match = data.message.match(/hint2['":].*?['"]([^'"]+)['"]/i);
          
          if (riddleMatch && answerMatch) {
            riddleData = {
              riddle: riddleMatch[1],
              answer: answerMatch[1],
              hint1: hint1Match ? hint1Match[1] : "Think about what the riddle describes",
              hint2: hint2Match ? hint2Match[1] : "The answer is something you know"
            };
          }
        }
      } else if (data.response) {
        try {
          let cleanResponse = data.response.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          riddleData = JSON.parse(cleanResponse);
        } catch {
          // Similar fallback for response field
          const riddleMatch = data.response.match(/riddle['":].*?['"]([^'"]+)['"]/i);
          const answerMatch = data.response.match(/answer['":].*?['"]([^'"]+)['"]/i);
          const hint1Match = data.response.match(/hint1['":].*?['"]([^'"]+)['"]/i);
          const hint2Match = data.response.match(/hint2['":].*?['"]([^'"]+)['"]/i);
          
          if (riddleMatch && answerMatch) {
            riddleData = {
              riddle: riddleMatch[1],
              answer: answerMatch[1],
              hint1: hint1Match ? hint1Match[1] : "Think about what the riddle describes",
              hint2: hint2Match ? hint2Match[1] : "The answer is something you know"
            };
          }
        }
      }
      
      if (riddleData && riddleData.riddle && riddleData.answer) {
        setState(prev => ({
          ...prev,
          riddle: riddleData.riddle,
          answer: riddleData.answer,
          hint1: riddleData.hint1 || "Think about what the riddle describes",
          hint2: riddleData.hint2 || "The answer is something you know",
          loading: false,
        }));
      } else {
        throw new Error('Invalid riddle format');
      }
    } catch (error) {
      console.error('Failed to generate riddle:', error);
      const fallbackRiddles = FALLBACK_RIDDLES[state.difficulty];
      const randomRiddle = fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
      
      setState(prev => ({
        ...prev,
        riddle: randomRiddle.riddle,
        answer: randomRiddle.answer,
        hint1: randomRiddle.hint1,
        hint2: randomRiddle.hint2,
        loading: false,
      }));
    }
  };

  const checkAnswer = () => {
    const isCorrect = isFuzzyMatch(state.userAnswer, state.answer);
    
    if (isCorrect) {
      const basePoints = state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 15 : 20;
      const hintPenalty = state.hintsUsed * 2;
      const points = Math.max(basePoints - hintPenalty, 1);
      
      const newScore = state.score + points;
      const newTotalScore = state.totalScore + points;
      const newStreak = state.streak + 1;
      const newBestStreak = Math.max(state.bestStreak, newStreak);
      
      setState(prev => ({
        ...prev,
        score: newScore,
        totalScore: newTotalScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        showAnswer: true,
      }));
      
      localStorage.setItem('riddlemaster-total-score', newTotalScore.toString());
      localStorage.setItem('riddlemaster-best-streak', newBestStreak.toString());
    } else {
      setState(prev => ({
        ...prev,
        streak: 0,
        showAnswer: true,
      }));
    }
  };

  const useHint = (hintNumber: 1 | 2) => {
    setState(prev => ({
      ...prev,
      hintsUsed: Math.max(prev.hintsUsed, hintNumber),
    }));
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setState(prev => ({
      ...prev,
      difficulty,
      score: 0,
    }));
  };

  const resetStats = () => {
    setState(prev => ({ ...prev, totalScore: 0, bestStreak: 0 }));
    localStorage.removeItem('riddlemaster-total-score');
    localStorage.removeItem('riddlemaster-best-streak');
  };

  const isCorrect = state.showAnswer && isFuzzyMatch(state.userAnswer, state.answer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
            🧩 Riddle Master
          </h1>
          
          <div className="flex justify-center gap-2 mb-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-4 py-2 rounded-lg capitalize font-semibold transition-all ${
                  state.difficulty === level
                    ? 'bg-yellow-500 text-black shadow-lg'
                    : 'bg-gray-600 text-white hover:bg-gray-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6 text-lg">
            <div>Session: <span className="font-bold text-yellow-400">{state.score}</span></div>
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
            <div className="text-2xl mb-4">🎲 Generating a new riddle...</div>
            <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-center text-yellow-300">Solve This Riddle:</h2>
              <div className="text-xl leading-relaxed text-center bg-gray-800 bg-opacity-50 rounded-lg p-6">
                {state.riddle}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => useHint(1)}
                  disabled={state.hintsUsed >= 1 || state.showAnswer}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hint 1 💡
                </button>
                <button
                  onClick={() => useHint(2)}
                  disabled={state.hintsUsed < 1 || state.showAnswer}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hint 2 💡💡
                </button>
              </div>
              
              {state.hintsUsed >= 1 && (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-2">
                  <strong>Hint 1:</strong> {state.hint1}
                </div>
              )}
              
              {state.hintsUsed >= 2 && (
                <div className="bg-orange-200 text-orange-900 p-3 rounded-lg">
                  <strong>Hint 2:</strong> {state.hint2}
                </div>
              )}
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={state.userAnswer}
                onChange={(e) => setState(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 text-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={state.showAnswer}
                onKeyPress={(e) => e.key === 'Enter' && !state.showAnswer && state.userAnswer.trim() && checkAnswer()}
              />
            </div>

            <div className="text-center space-y-4">
              {!state.showAnswer ? (
                <button
                  onClick={checkAnswer}
                  disabled={!state.userAnswer.trim()}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg text-xl font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              ) : (
                <div className="space-y-4">
                  <div className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
                  </div>
                  
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                    <div className="text-lg">
                      <strong>The answer was:</strong> <span className="text-yellow-300">{state.answer}</span>
                    </div>
                    {isCorrect && state.hintsUsed > 0 && (
                      <div className="text-sm text-orange-300 mt-2">
                        Points earned: {Math.max((state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 15 : 20) - (state.hintsUsed * 2), 1)}
                        {state.hintsUsed > 0 && ` (${state.hintsUsed * 2} points deducted for hints)`}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={generateNewRiddle}
                    className="px-8 py-3 bg-purple-500 text-white rounded-lg text-xl font-semibold hover:bg-purple-600"
                  >
                    Next Riddle ➡️
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions mt-8 bg-gradient-to-r from-indigo-900 to-purple-900 bg-opacity-50 p-6 rounded-lg shadow-lg border border-indigo-400">
          <h3 className="text-xl font-bold text-indigo-300 mb-4 flex items-center">
            <span className="mr-2">🧩</span>
            How to Play Riddle Master
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-indigo-400 mb-2">🎯 Objective</h4>
              <p className="text-sm mb-3">Solve AI-generated riddles using your wit and logic!</p>
              
              <h4 className="font-semibold text-indigo-400 mb-2">🎮 Difficulty Levels</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Easy:</strong> Simple riddles, 10 points</li>
                <li>• <strong>Medium:</strong> Moderate challenge, 15 points</li>
                <li>• <strong>Hard:</strong> Brain teasers, 20 points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-400 mb-2">⚡ Scoring & Hints</h4>
              <ul className="text-sm space-y-1">
                <li>• Each hint costs 2 points</li>
                <li>• Minimum 1 point per correct answer</li>
                <li>• Build streaks for bonus satisfaction!</li>
                <li>• Progressive hints get more specific</li>
              </ul>
              
              <h4 className="font-semibold text-indigo-400 mb-2 mt-3">💡 Tips</h4>
              <ul className="text-sm space-y-1">
                <li>• Think creatively - riddles use wordplay</li>
                <li>• Use hints sparingly to maximize points</li>
                <li>• Consider multiple meanings of words</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
