'use client';

import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface SightWordsState {
  words: string[];
  current: number;
  flipped: boolean;
  score: number;
  totalScore: number;
  wordsAttempted: number;
  difficulty: Difficulty;
  loading: boolean;
}

export default function SightWords() {
  const [state, setState] = useState<SightWordsState>({
    words: [],
    current: 0,
    flipped: false,
    score: 0,
    totalScore: 0,
    wordsAttempted: 0,
    difficulty: 'easy',
    loading: false,
  });

  useEffect(() => {
    const savedScore = localStorage.getItem('sightwords-total-score');
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [state.difficulty]);

  const fetchWords = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate 20 sight words for ${state.difficulty} level reading. Return only a JSON array of words.`,
        }),
      });

      const data = await response.json();
      let words: string[] = [];
      
      if (Array.isArray(data)) {
        words = data;
      } else if (data.response) {
        try {
          words = JSON.parse(data.response);
        } catch {
          words = data.response.split(/[,\s]+/).filter(Boolean);
        }
      }
      
      setState(prev => ({
        ...prev,
        words,
        current: 0,
        flipped: false,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch words:', error);
      const fallbackWords = state.difficulty === 'easy' 
        ? ['the', 'and', 'to', 'a', 'I', 'it', 'in', 'was', 'said', 'his', 'her', 'he', 'on', 'for', 'they', 'you', 'all', 'but', 'not', 'what']
        : state.difficulty === 'medium'
        ? ['because', 'different', 'through', 'much', 'before', 'right', 'too', 'any', 'same', 'our', 'where', 'after', 'back', 'little', 'only', 'around', 'know', 'came', 'work', 'three']
        : ['although', 'between', 'important', 'until', 'children', 'sometimes', 'mountain', 'without', 'sentence', 'earth', 'thought', 'enough', 'almost', 'above', 'paper', 'together', 'during', 'always', 'however', 'example'];
      
      setState(prev => ({
        ...prev,
        words: fallbackWords,
        current: 0,
        flipped: false,
        loading: false,
      }));
    }
  };

  const handleNext = () => {
    if (state.current < state.words.length - 1) {
      setState(prev => ({
        ...prev,
        current: prev.current + 1,
        flipped: false,
      }));
    } else {
      fetchWords();
    }
  };

  const handleAnswer = (correct: boolean) => {
    const newScore = correct ? state.score + 1 : state.score;
    const newTotalScore = correct ? state.totalScore + 1 : state.totalScore;
    const newWordsAttempted = state.wordsAttempted + 1;

    setState(prev => ({
      ...prev,
      score: newScore,
      totalScore: newTotalScore,
      wordsAttempted: newWordsAttempted,
    }));

    localStorage.setItem('sightwords-total-score', newTotalScore.toString());
    setTimeout(handleNext, 1000);
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setState(prev => ({
      ...prev,
      difficulty,
      score: 0,
      wordsAttempted: 0,
    }));
  };

  const resetScore = () => {
    setState(prev => ({ ...prev, totalScore: 0 }));
    localStorage.removeItem('sightwords-total-score');
  };

  const currentWord = state.words[state.current] || '';

  return (
    <div className="sight-words-game p-6 max-w-2xl mx-auto">
      <div className="header mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">Sophie's Words</h1>
        
        <div className="difficulty-selector flex justify-center gap-2 mb-4">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              className={`px-4 py-2 rounded capitalize ${
                state.difficulty === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="score-display text-center">
          <div className="text-lg">
            Session: {state.score}/{state.wordsAttempted} | Total: {state.totalScore}
          </div>
          <button
            onClick={resetScore}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Reset Total Score
          </button>
        </div>
      </div>

      {state.loading ? (
        <div className="text-center py-12">
          <div className="text-xl">Loading words...</div>
        </div>
      ) : (
        <>
          <div className="flip-card-container mb-8 flex justify-center">
            <div 
              className="flip-card w-96 h-64 relative"
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`flip-card-inner absolute w-full h-full transition-transform duration-700 ${state.flipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div 
                  className="flip-card-front absolute w-full h-full bg-white border-2 border-blue-300 rounded-lg shadow-lg flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-6xl font-bold text-blue-800">
                    {currentWord}
                  </div>
                </div>
                <div 
                  className="flip-card-back absolute w-full h-full bg-green-100 border-2 border-green-300 rounded-lg shadow-lg flex items-center justify-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-2xl text-green-800 text-center">
                    Did you say it correctly?
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="controls text-center space-y-4">
            {!state.flipped ? (
              <button
                onClick={() => setState(prev => ({ ...prev, flipped: true }))}
                className="px-8 py-3 bg-green-500 text-white rounded-lg text-xl hover:bg-green-600 disabled:opacity-50"
                disabled={!currentWord}
              >
                I'm Ready to Answer
              </button>
            ) : (
              <div className="answer-buttons space-x-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600"
                >
                  ✓ Correct
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg hover:bg-red-600"
                >
                  ✗ Incorrect
                </button>
              </div>
            )}

            <div>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={!currentWord}
              >
                Skip Word
              </button>
            </div>
          </div>

          <div className="progress text-center mt-6 text-gray-600">
            Word {state.current + 1} of {state.words.length}
          </div>
        </>
      )}
    </div>
  );
}