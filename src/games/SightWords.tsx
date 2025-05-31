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
  usedWords: string[];
  isPlaying: boolean;
  audioSupported: boolean;
  incorrectWords: string[];
  showPracticeList: boolean;
  showDefinition: boolean;
  currentDefinition: string;
  loadingDefinition: boolean;
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
    usedWords: [],
    isPlaying: false,
    audioSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    incorrectWords: [],
    showPracticeList: false,
    showDefinition: false,
    currentDefinition: '',
    loadingDefinition: false,
  });

  useEffect(() => {
    const savedScore = localStorage.getItem('sightwords-total-score');
    const savedUsedWords = localStorage.getItem(`sightwords-used-words-${state.difficulty}`);
    const savedIncorrectWords = localStorage.getItem(`sightwords-incorrect-words-${state.difficulty}`);
    
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
    
    if (savedUsedWords) {
      try {
        const usedWords = JSON.parse(savedUsedWords);
        setState(prev => ({ ...prev, usedWords }));
      } catch (error) {
        console.error('Failed to parse used words:', error);
      }
    }
    
    if (savedIncorrectWords) {
      try {
        const incorrectWords = JSON.parse(savedIncorrectWords);
        setState(prev => ({ ...prev, incorrectWords }));
      } catch (error) {
        console.error('Failed to parse incorrect words:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Load used words and incorrect words for the current difficulty
    const savedUsedWords = localStorage.getItem(`sightwords-used-words-${state.difficulty}`);
    const savedIncorrectWords = localStorage.getItem(`sightwords-incorrect-words-${state.difficulty}`);
    let usedWords: string[] = [];
    let incorrectWords: string[] = [];
    
    if (savedUsedWords) {
      try {
        usedWords = JSON.parse(savedUsedWords);
        setState(prev => ({ ...prev, usedWords }));
      } catch (error) {
        console.error('Failed to parse used words:', error);
        setState(prev => ({ ...prev, usedWords: [] }));
      }
    } else {
      setState(prev => ({ ...prev, usedWords: [] }));
    }
    
    if (savedIncorrectWords) {
      try {
        incorrectWords = JSON.parse(savedIncorrectWords);
        setState(prev => ({ ...prev, incorrectWords }));
      } catch (error) {
        console.error('Failed to parse incorrect words:', error);
        setState(prev => ({ ...prev, incorrectWords: [] }));
      }
    } else {
      setState(prev => ({ ...prev, incorrectWords: [] }));
    }
    
    // Fetch words with the loaded used words
    fetchWordsWithUsedList(usedWords);
  }, [state.difficulty]);

  // Cleanup speech synthesis when component unmounts or word changes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [state.words, state.current]);

  // Stop speech when moving to next word
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [state.current]);

  const fetchWordsWithUsedList = async (usedWords: string[] = state.usedWords) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const usedWordsText = usedWords.length > 0 
        ? `\n\nPreviously used words to avoid: ${usedWords.join(', ')}`
        : '';
        
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: [
            {
              role: 'user',
              content: `Generate 20 sight words for ${state.difficulty} level reading. Return only a JSON array of words.${usedWordsText}`
            }
          ]
        }),
      });

      const data = await response.json();
      let words: string[] = [];
      
      if (Array.isArray(data)) {
        words = data;
      } else if (data.message) {
        try {
          // Remove markdown code blocks if present
          let cleanMessage = data.message.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          
          // Try to parse as JSON first
          words = JSON.parse(cleanMessage);
        } catch {
          // If JSON parsing fails, try to extract words using regex
          const wordMatches = data.message.match(/"([^"]+)"/g);
          if (wordMatches) {
            words = wordMatches.map((match: string) => match.replace(/"/g, ''));
          } else {
            // Fallback: split by common delimiters
            words = data.message.split(/[,\s\[\]]+/).filter((word: string) => 
              word && !word.match(/^[\[\]{}":,\s]*$/)
            );
          }
        }
      } else if (data.response) {
        try {
          // Remove markdown code blocks if present
          let cleanResponse = data.response.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          words = JSON.parse(cleanResponse);
        } catch {
          // If JSON parsing fails, try to extract words using regex
          const wordMatches = data.response.match(/"([^"]+)"/g);
          if (wordMatches) {
            words = wordMatches.map((match: string) => match.replace(/"/g, ''));
          } else {
            // Fallback: split by common delimiters
            words = data.response.split(/[,\s\[\]]+/).filter((word: string) => 
              word && !word.match(/^[\[\]{}":,\s]*$/)
            );
          }
        }
      }
      
      // Remove quotes and JSON artifacts from words
      words = words.map(word => 
        word.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()
      ).filter(word => word.length > 0);
      
      // Update used words list
      const newUsedWords = [...usedWords, ...words];
      
      // Save used words to localStorage
      localStorage.setItem(`sightwords-used-words-${state.difficulty}`, JSON.stringify(newUsedWords));
      
      setState(prev => ({
        ...prev,
        words,
        current: 0,
        flipped: false,
        loading: false,
        usedWords: newUsedWords,
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

  const fetchWords = () => {
    fetchWordsWithUsedList();
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
    const currentWord = state.words[state.current];

    // If incorrect, add to incorrect words list
    let newIncorrectWords = [...state.incorrectWords];
    if (!correct && currentWord && !newIncorrectWords.includes(currentWord)) {
      newIncorrectWords.push(currentWord);
      localStorage.setItem(`sightwords-incorrect-words-${state.difficulty}`, JSON.stringify(newIncorrectWords));
    }

    setState(prev => ({
      ...prev,
      score: newScore,
      totalScore: newTotalScore,
      wordsAttempted: newWordsAttempted,
      incorrectWords: newIncorrectWords,
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
      usedWords: [], // Will be loaded by useEffect
      showPracticeList: false,
      showDefinition: false,
    }));
  };

  const resetScore = () => {
    setState(prev => ({ ...prev, totalScore: 0 }));
    localStorage.removeItem('sightwords-total-score');
  };

  const clearWordHistory = () => {
    setState(prev => ({ ...prev, usedWords: [] }));
    localStorage.removeItem(`sightwords-used-words-${state.difficulty}`);
  };

  const clearIncorrectWords = () => {
    setState(prev => ({ ...prev, incorrectWords: [] }));
    localStorage.removeItem(`sightwords-incorrect-words-${state.difficulty}`);
  };

  const fetchWordDefinition = async (word: string) => {
    setState(prev => ({ ...prev, loadingDefinition: true, showDefinition: true }));
    
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
              content: `Provide a simple, child-friendly definition of the word "${word}" in 1-2 sentences. Make it easy for kids to understand.`
            }
          ]
        }),
      });

      const data = await response.json();
      let definition = '';
      
      if (data.message) {
        definition = data.message.trim();
      } else if (data.response) {
        definition = data.response.trim();
      } else {
        definition = `A word that you can practice saying and reading.`;
      }

      setState(prev => ({
        ...prev,
        currentDefinition: definition,
        loadingDefinition: false,
      }));
    } catch (error) {
      console.error('Failed to fetch definition:', error);
      setState(prev => ({
        ...prev,
        currentDefinition: `"${word}" is a word that you can practice saying and reading.`,
        loadingDefinition: false,
      }));
    }
  };

  const togglePracticeList = () => {
    setState(prev => ({ 
      ...prev, 
      showPracticeList: !prev.showPracticeList,
      showDefinition: false 
    }));
  };

  const practiceIncorrectWord = (word: string) => {
    const wordIndex = state.words.indexOf(word);
    if (wordIndex !== -1) {
      setState(prev => ({
        ...prev,
        current: wordIndex,
        flipped: false,
        showPracticeList: false,
        showDefinition: false,
      }));
    }
  };

  const playWordAudio = () => {
    const wordToSpeak = state.words[state.current];
    if (!state.audioSupported || !wordToSpeak) return;
    
    setState(prev => ({ ...prev, isPlaying: true }));
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    utterance.rate = 0.7; // Slower rate for kids
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };
    
    utterance.onerror = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const currentWord = state.words[state.current] || '';

  return (
    <div className="sight-words-game p-6 max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100">
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
          <div className="text-sm text-gray-600 mb-2">
            Words used this level: {state.usedWords.length} | Need practice: {state.incorrectWords.length}
          </div>
          <div className="flex justify-center gap-4 mb-2">
            <button
              onClick={resetScore}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Reset Total Score
            </button>
            <button
              onClick={clearWordHistory}
              className="text-sm text-blue-500 hover:text-blue-700 underline"
            >
              Clear Word History
            </button>
            {state.incorrectWords.length > 0 && (
              <>
                <button
                  onClick={togglePracticeList}
                  className="text-sm text-purple-500 hover:text-purple-700 underline"
                >
                  {state.showPracticeList ? 'Hide' : 'Show'} Practice List
                </button>
                <button
                  onClick={clearIncorrectWords}
                  className="text-sm text-orange-500 hover:text-orange-700 underline"
                >
                  Clear Practice List
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Practice List */}
      {state.showPracticeList && state.incorrectWords.length > 0 && (
        <div className="practice-list mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-center mb-3 text-yellow-800">
            Words to Practice ({state.incorrectWords.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {state.incorrectWords.map((word, index) => (
              <button
                key={index}
                onClick={() => practiceIncorrectWord(word)}
                className="p-2 bg-white border border-yellow-300 rounded hover:bg-yellow-100 text-center"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Definition Display */}
      {state.showDefinition && (
        <div className="definition-display mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-blue-800">
              Definition of "{currentWord}"
            </h3>
            <button
              onClick={() => setState(prev => ({ ...prev, showDefinition: false }))}
              className="text-blue-600 hover:text-blue-800 text-xl"
            >
              ×
            </button>
          </div>
          {state.loadingDefinition ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Loading definition...
            </div>
          ) : (
            <p className="text-blue-700">{state.currentDefinition}</p>
          )}
        </div>
      )}

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
                  className="flip-card-back absolute w-full h-full bg-green-100 border-2 border-green-300 rounded-lg shadow-lg flex flex-col items-center justify-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-2xl text-green-800 text-center mb-4">
                    Did you say it correctly?
                  </div>
                  <div className="flex flex-col gap-3 items-center">
                    {state.audioSupported && (
                      <button
                        onClick={playWordAudio}
                        disabled={state.isPlaying}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Listen to the word"
                      >
                        {state.isPlaying ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Playing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.914 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.914l3.469-2.816a1 1 0 011.617.816zM16 10a1 1 0 01-.832.986 4.002 4.002 0 010-1.972A1 1 0 0116 10zm-4 3.75a1 1 0 01-.832.986 8.003 8.003 0 010-9.472A1 1 0 0112 6.25v7.5z" clipRule="evenodd" />
                            </svg>
                            Listen
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => fetchWordDefinition(currentWord)}
                      disabled={state.loadingDefinition}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Get word definition"
                    >
                      {state.loadingDefinition ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Definition
                        </>
                      )}
                    </button>
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
