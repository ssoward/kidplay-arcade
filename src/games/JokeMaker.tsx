import React, { useState, useEffect } from 'react';

interface JokeState {
  currentJoke: string;
  loading: boolean;
  category: string;
  difficulty: string;
  score: number;
  totalJokes: number;
  rating: number | null;
  jokeHistory: string[];
}

interface GameStats {
  totalJokes: number;
  totalScore: number;
  averageRating: number;
  favoriteCategory: string;
}

const JokeMaker: React.FC = () => {
  const [state, setState] = useState<JokeState>({
    currentJoke: '',
    loading: false,
    category: 'animals',
    difficulty: 'easy',
    score: 0,
    totalJokes: 0,
    rating: null,
    jokeHistory: []
  });

  const [stats, setStats] = useState<GameStats>({
    totalJokes: 0,
    totalScore: 0,
    averageRating: 0,
    favoriteCategory: 'animals'
  });

  const categories = [
    'animals', 'food', 'school', 'sports', 'family', 'nature', 'space', 'technology'
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy (Simple & Silly)' },
    { value: 'medium', label: 'Medium (Clever & Fun)' },
    { value: 'hard', label: 'Hard (Witty & Smart)' }
  ];

  useEffect(() => {
    const savedStats = localStorage.getItem('jokeMaker-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    localStorage.setItem('jokeMaker-stats', JSON.stringify(newStats));
  };

  const generateJoke = async () => {
    try {
      // Capture current state values before any async operations
      const currentJokeHistory = state.jokeHistory;
      const currentDifficulty = state.difficulty;
      const currentCategory = state.category;
      
      // Set loading state
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        rating: null,
        currentJoke: '' // Clear current joke immediately
      }));
      
      // Create history context for AI
      const historyContext = currentJokeHistory.length > 0 
        ? `\n\nPrevious jokes you've already told (DO NOT repeat any of these):\n${currentJokeHistory.map((joke, i) => `${i + 1}. ${joke}`).join('\n')}\n\nMake sure your new joke is completely different from all the previous ones.`
        : '';

      const prompt = `Generate a ${currentDifficulty} level, kid-friendly joke about ${currentCategory}. 
      Make it appropriate for children ages 6-12. The joke should be clean, fun, and easy to understand.
      ${currentDifficulty === 'easy' ? 'Use simple words and silly humor.' : ''}
      ${currentDifficulty === 'medium' ? 'Use clever wordplay and puns.' : ''}
      ${currentDifficulty === 'hard' ? 'Use witty humor and smart observations.' : ''}
      ${historyContext}
      Just return the joke, nothing else.`;

      console.log('Generating joke with prompt:', prompt.substring(0, 200) + '...');

      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('Failed to generate joke');

      const data = await response.json();
      const joke = data.message?.trim() || data.response?.trim() || "Why don't scientists trust atoms? Because they make up everything!";

      console.log('API Response data:', data);
      console.log('Generated joke:', joke);
      console.log('Previous joke history length:', currentJokeHistory.length);

      // Update state with new joke
      setState(prev => ({
        ...prev,
        currentJoke: joke,
        loading: false,
        rating: null,
        totalJokes: prev.totalJokes + 1,
        jokeHistory: [...prev.jokeHistory, joke].slice(-20)
      }));

    } catch (error) {
      console.error('Error generating joke:', error);
      const fallbackJokes = [
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call a sleeping bull? A bulldozer!",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fish wearing a crown? A king fish!",
        "Why did the math book look so sad? Because it had too many problems!"
      ];
      
      // Filter out previously used fallback jokes
      const availableFallbacks = fallbackJokes.filter(joke => !state.jokeHistory.includes(joke));
      const selectedJoke = availableFallbacks.length > 0 
        ? availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)]
        : fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      
      console.log('Using fallback joke:', selectedJoke);
      
      setState(prev => ({
        ...prev,
        currentJoke: selectedJoke,
        loading: false,
        rating: null,
        totalJokes: prev.totalJokes + 1,
        jokeHistory: [...prev.jokeHistory, selectedJoke].slice(-20)
      }));
    }
  };

  const rateJoke = (rating: number) => {
    setState(prev => ({ ...prev, rating }));
    
    const newScore = state.score + rating;
    const newStats: GameStats = {
      totalJokes: stats.totalJokes + 1,
      totalScore: stats.totalScore + rating,
      averageRating: (stats.totalScore + rating) / (stats.totalJokes + 1),
      favoriteCategory: state.category // Simplified for now
    };
    
    setState(prev => ({ ...prev, score: newScore }));
    saveStats(newStats);
  };

  const resetGame = () => {
    setState({
      currentJoke: '',
      loading: false,
      category: 'animals',
      difficulty: 'easy',
      score: 0,
      totalJokes: 0,
      rating: null,
      jokeHistory: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤣 Joke Maker 🎭</h1>
          <p className="text-white/90 text-lg">Create hilarious jokes with AI!</p>
        </div>

        {/* Stats Panel */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{state.totalJokes}</div>
              <div className="text-white/80 text-sm">Jokes Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{state.jokeHistory.length}</div>
              <div className="text-white/80 text-sm">Unique Jokes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{state.score}</div>
              <div className="text-white/80 text-sm">Total Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
              <div className="text-white/80 text-sm">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={state.category}
                onChange={(e) => setState(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={state.difficulty}
                onChange={(e) => setState(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={generateJoke}
            disabled={state.loading}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {state.loading ? '🎭 Creating Joke...' : '🎲 Generate New Joke'}
          </button>
          
          {state.jokeHistory.length > 0 && (
            <div className="mt-2 text-center text-sm text-gray-600">
              🧠 AI will avoid repeating your {state.jokeHistory.length} previous joke{state.jokeHistory.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Joke Display */}
        {state.currentJoke && (
          <div key={`joke-${state.totalJokes}-${Date.now()}`} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😂</div>
              <div className="text-xl text-gray-800 mb-6 leading-relaxed">
                {state.currentJoke}
              </div>
              
              {/* Debug info - remove this later */}
              <div className="text-xs text-gray-400 mb-2">
                Joke #{state.totalJokes} | History: {state.jokeHistory.length} jokes
              </div>
              
              {/* Rating */}
              <div className="border-t pt-4">
                <p className="text-gray-600 mb-3">How funny was this joke?</p>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => rateJoke(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        state.rating && star <= state.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {state.rating && (
                  <p className="text-sm text-gray-600 mt-2">
                    You rated this joke {state.rating} out of 5 stars!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetGame}
            className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Reset Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default JokeMaker;
