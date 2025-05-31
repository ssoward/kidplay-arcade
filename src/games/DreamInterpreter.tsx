'use client';

import { useState, useEffect } from 'react';

interface DreamData {
  interpretation: string;
  meaning: string;
  symbolism: string;
  advice: string;
}

interface DreamInterpreterState {
  userDream: string;
  interpretation: DreamData | null;
  loading: boolean;
  score: number;
  totalScore: number;
  dreamCount: number;
  savedDreams: Array<{
    dream: string;
    interpretation: DreamData;
    date: string;
  }>;
  showHistory: boolean;
}

const DREAM_CATEGORIES = [
  { emoji: '🌟', name: 'Adventure', keywords: ['flying', 'journey', 'quest', 'exploration'] },
  { emoji: '🏰', name: 'Fantasy', keywords: ['magic', 'castle', 'wizard', 'fairy'] },
  { emoji: '🐾', name: 'Animals', keywords: ['dog', 'cat', 'bird', 'lion', 'elephant'] },
  { emoji: '🌊', name: 'Nature', keywords: ['ocean', 'forest', 'mountain', 'river'] },
  { emoji: '👨‍👩‍👧‍👦', name: 'Family', keywords: ['mom', 'dad', 'family', 'friend'] },
  { emoji: '🎈', name: 'Fun', keywords: ['party', 'game', 'toy', 'playground'] },
];

const FALLBACK_INTERPRETATIONS = [
  {
    interpretation: "Your dream shows your creative imagination at work! Dreams about adventure often mean you're ready to try new things.",
    meaning: "This dream suggests you have a brave heart and love exploring new ideas.",
    symbolism: "Adventure in dreams represents growth, curiosity, and the excitement of learning.",
    advice: "Keep being curious and don't be afraid to try new activities or make new friends!"
  },
  {
    interpretation: "What a wonderful dream! Dreams about family and friends show how much love you have in your heart.",
    meaning: "This dream means you care deeply about the people around you.",
    symbolism: "Family and friends in dreams represent safety, love, and belonging.",
    advice: "Remember to tell your loved ones how much they mean to you!"
  },
  {
    interpretation: "Dreams about animals are magical! They often represent different parts of your personality.",
    meaning: "This dream shows you have a kind heart and connect well with nature.",
    symbolism: "Animals in dreams can represent friendship, loyalty, and natural wisdom.",
    advice: "Spend time in nature and be kind to all living creatures!"
  }
];

export default function DreamInterpreter() {
  const [state, setState] = useState<DreamInterpreterState>({
    userDream: '',
    interpretation: null,
    loading: false,
    score: 0,
    totalScore: 0,
    dreamCount: 0,
    savedDreams: [],
    showHistory: false,
  });

  useEffect(() => {
    const savedScore = localStorage.getItem('dreaminterpreter-total-score');
    const savedCount = localStorage.getItem('dreaminterpreter-dream-count');
    const savedDreams = localStorage.getItem('dreaminterpreter-saved-dreams');
    
    if (savedScore) {
      setState(prev => ({ ...prev, totalScore: parseInt(savedScore, 10) }));
    }
    if (savedCount) {
      setState(prev => ({ ...prev, dreamCount: parseInt(savedCount, 10) }));
    }
    if (savedDreams) {
      setState(prev => ({ ...prev, savedDreams: JSON.parse(savedDreams) }));
    }
  }, []);

  const interpretDream = async () => {
    if (!state.userDream.trim()) return;

    setState(prev => ({ ...prev, loading: true, interpretation: null }));

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
              content: `Please interpret this dream for a child in a positive, encouraging way: "${state.userDream}"

              Return a JSON object with:
              {
                "interpretation": "A fun, positive explanation of what the dream might mean",
                "meaning": "What this dream says about the child's personality or feelings",
                "symbolism": "Simple explanation of any symbols in the dream",
                "advice": "Encouraging advice or activity suggestion based on the dream"
              }
              
              Keep it age-appropriate, positive, and inspiring for kids!`
            }
          ]
        }),
      });

      const data = await response.json();
      let dreamData: any = null;
      
      if (data.message) {
        try {
          let cleanMessage = data.message.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          dreamData = JSON.parse(cleanMessage);
        } catch {
          // Try to extract from text if JSON parsing fails
          const interpretationMatch = data.message.match(/interpretation['":].*?['"]([^'"]+)['"]/i);
          const meaningMatch = data.message.match(/meaning['":].*?['"]([^'"]+)['"]/i);
          const symbolismMatch = data.message.match(/symbolism['":].*?['"]([^'"]+)['"]/i);
          const adviceMatch = data.message.match(/advice['":].*?['"]([^'"]+)['"]/i);
          
          if (interpretationMatch) {
            dreamData = {
              interpretation: interpretationMatch[1],
              meaning: meaningMatch ? meaningMatch[1] : "Your dream shows your wonderful imagination!",
              symbolism: symbolismMatch ? symbolismMatch[1] : "Dreams are full of interesting symbols and meanings.",
              advice: adviceMatch ? adviceMatch[1] : "Keep dreaming and stay curious!"
            };
          }
        }
      } else if (data.response) {
        try {
          let cleanResponse = data.response.trim().replace(/^```[a-zA-Z]*\n?|```$/g, '');
          dreamData = JSON.parse(cleanResponse);
        } catch {
          const interpretationMatch = data.response.match(/interpretation['":].*?['"]([^'"]+)['"]/i);
          const meaningMatch = data.response.match(/meaning['":].*?['"]([^'"]+)['"]/i);
          const symbolismMatch = data.response.match(/symbolism['":].*?['"]([^'"]+)['"]/i);
          const adviceMatch = data.response.match(/advice['":].*?['"]([^'"]+)['"]/i);
          
          if (interpretationMatch) {
            dreamData = {
              interpretation: interpretationMatch[1],
              meaning: meaningMatch ? meaningMatch[1] : "Your dream shows your wonderful imagination!",
              symbolism: symbolismMatch ? symbolismMatch[1] : "Dreams are full of interesting symbols and meanings.",
              advice: adviceMatch ? adviceMatch[1] : "Keep dreaming and stay curious!"
            };
          }
        }
      }
      
      if (!dreamData || !dreamData.interpretation) {
        throw new Error('Invalid interpretation format');
      }

      const points = 5;
      const newScore = state.score + points;
      const newTotalScore = state.totalScore + points;
      const newDreamCount = state.dreamCount + 1;
      
      const dreamEntry = {
        dream: state.userDream,
        interpretation: dreamData,
        date: new Date().toLocaleDateString()
      };
      
      const newSavedDreams = [dreamEntry, ...state.savedDreams.slice(0, 9)]; // Keep last 10 dreams
      
      setState(prev => ({
        ...prev,
        interpretation: dreamData,
        loading: false,
        score: newScore,
        totalScore: newTotalScore,
        dreamCount: newDreamCount,
        savedDreams: newSavedDreams,
      }));
      
      localStorage.setItem('dreaminterpreter-total-score', newTotalScore.toString());
      localStorage.setItem('dreaminterpreter-dream-count', newDreamCount.toString());
      localStorage.setItem('dreaminterpreter-saved-dreams', JSON.stringify(newSavedDreams));
      
    } catch (error) {
      console.error('Failed to interpret dream:', error);
      const randomFallback = FALLBACK_INTERPRETATIONS[Math.floor(Math.random() * FALLBACK_INTERPRETATIONS.length)];
      
      const points = 5;
      const newScore = state.score + points;
      const newTotalScore = state.totalScore + points;
      const newDreamCount = state.dreamCount + 1;
      
      const dreamEntry = {
        dream: state.userDream,
        interpretation: randomFallback,
        date: new Date().toLocaleDateString()
      };
      
      const newSavedDreams = [dreamEntry, ...state.savedDreams.slice(0, 9)];
      
      setState(prev => ({
        ...prev,
        interpretation: randomFallback,
        loading: false,
        score: newScore,
        totalScore: newTotalScore,
        dreamCount: newDreamCount,
        savedDreams: newSavedDreams,
      }));
      
      localStorage.setItem('dreaminterpreter-total-score', newTotalScore.toString());
      localStorage.setItem('dreaminterpreter-dream-count', newDreamCount.toString());
      localStorage.setItem('dreaminterpreter-saved-dreams', JSON.stringify(newSavedDreams));
    }
  };

  const addDreamPrompt = (category: string) => {
    const currentDream = state.userDream;
    const newText = currentDream ? `${currentDream} ${category}` : category;
    setState(prev => ({ ...prev, userDream: newText }));
  };

  const clearDream = () => {
    setState(prev => ({ 
      ...prev, 
      userDream: '', 
      interpretation: null 
    }));
  };

  const resetStats = () => {
    setState(prev => ({ 
      ...prev, 
      totalScore: 0, 
      dreamCount: 0,
      savedDreams: []
    }));
    localStorage.removeItem('dreaminterpreter-total-score');
    localStorage.removeItem('dreaminterpreter-dream-count');
    localStorage.removeItem('dreaminterpreter-saved-dreams');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🌙✨ Dream Interpreter
          </h1>
          
          <div className="flex justify-center gap-6 text-lg mb-4">
            <div>Session: <span className="font-bold text-purple-400">{state.score}</span></div>
            <div>Total: <span className="font-bold text-green-400">{state.totalScore}</span></div>
            <div>Dreams: <span className="font-bold text-blue-400">{state.dreamCount}</span></div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setState(prev => ({ ...prev, showHistory: !prev.showHistory }))}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              {state.showHistory ? 'Hide' : 'Show'} Dream History
            </button>
            <button
              onClick={resetStats}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              Reset Stats
            </button>
          </div>
        </div>

        {state.showHistory && state.savedDreams.length > 0 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center text-purple-300">Dream Journal</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {state.savedDreams.map((entry, index) => (
                <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">{entry.date}</div>
                  <div className="text-yellow-300 mb-2"><strong>Dream:</strong> {entry.dream}</div>
                  <div className="text-purple-200 text-sm">{entry.interpretation.interpretation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 text-purple-300">Tell me about your dream!</h2>
            <p className="text-gray-300">Describe what you dreamed about, and I'll help you understand what it might mean.</p>
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2">Your Dream:</label>
            <textarea
              value={state.userDream}
              onChange={(e) => setState(prev => ({ ...prev, userDream: e.target.value }))}
              placeholder="I dreamed that I was flying over a magical forest..."
              className="w-full h-32 px-4 py-3 text-black rounded-lg text-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={state.loading}
            />
          </div>

          <div className="mb-6">
            <div className="text-lg font-semibold mb-3">Need inspiration? Click to add dream elements:</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DREAM_CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  onClick={() => addDreamPrompt(category.keywords[Math.floor(Math.random() * category.keywords.length)])}
                  className="px-3 py-2 bg-purple-600 bg-opacity-50 rounded-lg hover:bg-purple-500 transition-all text-sm"
                  disabled={state.loading}
                >
                  {category.emoji} {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4 mb-6">
            <div className="flex justify-center gap-4">
              <button
                onClick={interpretDream}
                disabled={!state.userDream.trim() || state.loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? 'Interpreting...' : 'Interpret My Dream ✨'}
              </button>
              
              {state.userDream && (
                <button
                  onClick={clearDream}
                  disabled={state.loading}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {state.loading && (
            <div className="text-center py-8">
              <div className="text-2xl mb-4">🌟 Interpreting your dream...</div>
              <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
            </div>
          )}

          {state.interpretation && !state.loading && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 bg-opacity-20 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4 text-center text-yellow-300">Your Dream Interpretation</h3>
                
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-300 mb-2">🌟 What Your Dream Means:</h4>
                    <p className="text-gray-100">{state.interpretation.interpretation}</p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-300 mb-2">💭 About You:</h4>
                    <p className="text-gray-100">{state.interpretation.meaning}</p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-300 mb-2">🔮 Dream Symbols:</h4>
                    <p className="text-gray-100">{state.interpretation.symbolism}</p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-pink-300 mb-2">🌈 Inspiration for You:</h4>
                    <p className="text-gray-100">{state.interpretation.advice}</p>
                  </div>
                </div>
                
                <div className="text-center mt-6">
                  <div className="text-lg text-yellow-400 mb-4">
                    ✨ You earned 5 dream points! ✨
                  </div>
                  <button
                    onClick={clearDream}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
                  >
                    Interpret Another Dream 🌙
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="instructions mt-8 bg-gradient-to-r from-purple-900 to-pink-900 bg-opacity-50 p-6 rounded-lg shadow-lg border border-purple-400">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
            <span className="mr-2">💭</span>
            How to Use Dream Interpreter
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">🌙 What This Does</h4>
              <p className="text-sm mb-3">Share your dreams and get fun, positive interpretations! This tool helps you explore what your dreams might mean in an encouraging way.</p>
              
              <h4 className="font-semibold text-purple-400 mb-2">✨ Features</h4>
              <ul className="text-sm space-y-1">
                <li>• Kid-friendly, positive interpretations</li>
                <li>• Dream journal to save your favorites</li>
                <li>• Fun emojis and encouraging messages</li>
                <li>• Points for sharing your dreams</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">📝 How to Share</h4>
              <ul className="text-sm space-y-1">
                <li>• Describe your dream in the text box</li>
                <li>• Include details like people, places, feelings</li>
                <li>• Dreams can be silly, scary, or wonderful!</li>
                <li>• Get a personalized interpretation</li>
              </ul>
              
              <h4 className="font-semibold text-purple-400 mb-2 mt-3">🏆 Dream Points</h4>
              <ul className="text-sm space-y-1">
                <li>• Earn 5 points for each dream shared</li>
                <li>• Build your collection in the dream journal</li>
                <li>• All dreams are celebrated equally!</li>
              </ul>
              
              <h4 className="font-semibold text-purple-400 mb-2 mt-3">💡 Remember</h4>
              <ul className="text-sm space-y-1">
                <li>• Dreams are personal and unique to you</li>
                <li>• Interpretations are for fun, not real advice</li>
                <li>• All dreams are valid and interesting!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
