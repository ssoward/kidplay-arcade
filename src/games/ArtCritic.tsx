import React from 'react';
import { useState, useEffect } from 'react';

interface ArtWork {
  title: string;
  artist: string;
  description: string;
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

interface GameState {
  currentArtwork: ArtWork | null;
  currentHintIndex: number;
  gameMode: 'guess-title' | 'guess-artist' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  totalGames: number;
  streak: number;
  bestStreak: number;
  userGuess: string;
  gameActive: boolean;
  showAnswer: boolean;
  loading: boolean;
  hintsUsed: number;
  artworkHistory: Array<{title: string; artist: string}>;
}

const FALLBACK_ARTWORKS = {
  easy: [
    {
      title: "Starry Night",
      artist: "Vincent van Gogh", 
      description: "A swirling night sky filled with bright stars hovers over a quiet village. Tall, dark cypress trees reach up like flames against the turbulent sky.",
      hints: [
        "This painting features a very famous swirling sky",
        "It was painted by a Dutch post-impressionist",
        "The artist cut off his own ear",
        "The sky has large, bright yellow stars"
      ],
      difficulty: 'easy' as const,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/757px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"
    },
    {
      title: "Mona Lisa",
      artist: "Leonardo da Vinci",
      description: "A woman with an enigmatic smile sits with her hands folded. Her eyes seem to follow the viewer, and the background shows a mysterious landscape.",
      hints: [
        "This is perhaps the most famous painting in the world",
        "The subject has a mysterious smile",
        "It's housed in the Louvre Museum",
        "The artist was also an inventor and scientist"
      ],
      difficulty: 'easy' as const,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/405px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"
    }
  ],
  medium: [
    {
      title: "The Persistence of Memory",
      artist: "Salvador Dalí",
      description: "Melting clocks drape over various objects in a dreamlike desert landscape. The surreal scene suggests time itself is fluid and malleable.",
      hints: [
        "This surrealist work features melting timepieces",
        "The artist was known for his eccentric mustache",
        "It's also called 'The Melting Clocks'",
        "The landscape appears to be inspired by Catalonia"
      ],
      difficulty: 'medium' as const,
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg"
    }
  ],
  hard: [
    {
      title: "Las Meninas",
      artist: "Diego Velázquez",
      description: "A complex court scene shows the Spanish royal family, with the artist himself visible painting a large canvas. Mirrors and doorways create layers of reality and illusion.",
      hints: [
        "This 17th-century Spanish masterpiece is famous for its complex perspective",
        "The artist painted himself into the scene",
        "It shows a young Spanish princess and her entourage",
        "The painting-within-a-painting creates multiple levels of reality"
      ],
      difficulty: 'hard' as const,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Las_Meninas_01.jpg/640px-Las_Meninas_01.jpg"
    }
  ]
};

export default function ArtCritic() {
  const [state, setState] = useState<GameState>({
    currentArtwork: null,
    currentHintIndex: 0,
    gameMode: 'mixed',
    difficulty: 'easy',
    score: 0,
    totalGames: 0,
    streak: 0,
    bestStreak: 0,
    userGuess: '',
    gameActive: false,
    showAnswer: false,
    loading: false,
    hintsUsed: 0,
    artworkHistory: [],
  });

  // Load saved stats
  useEffect(() => {
    const savedStats = localStorage.getItem('art-critic-stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setState(prev => ({
        ...prev,
        bestStreak: parsed.bestStreak || 0,
        score: parsed.totalScore || 0,
      }));
    }
  }, []);

  // Save stats
  const saveStats = () => {
    localStorage.setItem('art-critic-stats', JSON.stringify({
      bestStreak: state.bestStreak,
      totalScore: state.score,
    }));
  };

  // Helper function to search for artwork image
  const searchArtworkImage = async (title: string, artist: string): Promise<string | null> => {
    try {
      // Try to find a public domain or copyright-free image
      const query = `${title} ${artist} painting artwork`;
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(title)}&pithumbsize=400&origin=*`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        const page = pages[0];
        if (page && page.thumbnail && page.thumbnail.source) {
          return page.thumbnail.source;
        }
      }
      
      // Fallback to a generic art placeholder
      return `https://via.placeholder.com/400x300/f3e8ff/8b5cf6?text=${encodeURIComponent(title.substring(0, 20))}`;
    } catch (error) {
      console.error('Failed to search artwork image:', error);
      return `https://via.placeholder.com/400x300/f3e8ff/8b5cf6?text=${encodeURIComponent(title.substring(0, 20))}`;
    }
  };

  // Generate artwork description using AI
  const generateArtwork = async (difficulty?: 'easy' | 'medium' | 'hard'): Promise<ArtWork | null> => {
    setState(prev => ({ ...prev, loading: true }));
    
    const currentDifficulty = difficulty || state.difficulty;
    
    try {
      const difficultyPrompts = {
        easy: 'famous, well-known masterpieces like Starry Night or Mona Lisa',
        medium: 'moderately famous works or pieces by well-known artists', 
        hard: 'lesser-known but significant works or complex artistic concepts'
      };

      // Create history context for AI to avoid repetition
      const historyContext = state.artworkHistory.length > 0 
        ? `\n\nIMPORTANT: Do NOT choose any of these previously shown artworks:\n${state.artworkHistory.map(art => `- "${art.title}" by ${art.artist}`).join('\n')}\n\nPlease select a different artwork to ensure variety in the game.`
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
              content: `Create an art description game. Choose a ${difficultyPrompts[currentDifficulty]} artwork.${historyContext}

Describe the artwork as an AI art critic would, focusing on visual elements, composition, colors, and mood - but don't mention the title or artist name directly.

For well-known artworks, try to provide a Wikipedia image URL if possible. For others, you can leave imageUrl as null and we'll generate a placeholder.

IMPORTANT: Return ONLY a valid JSON object with no additional text, markdown formatting, or code blocks. Ensure all strings are properly escaped and there are no line breaks within string values.

Return exactly this JSON structure:
{
  "title": "artwork title",
  "artist": "artist name", 
  "description": "detailed visual description without revealing title or artist (use \\n for line breaks if needed)",
  "hints": ["hint 1", "hint 2", "hint 3", "hint 4"],
  "difficulty": "${currentDifficulty}",
  "imageUrl": null
}

The description should be vivid and help someone visualize the artwork. Hints should progressively reveal more information. Do not include quotes within the string values.`
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (data.message) {
        try {
          // Clean up the response - more aggressive cleaning
          let cleanMessage = data.message.trim();
          
          // Remove code blocks
          cleanMessage = cleanMessage.replace(/^```[a-zA-Z]*\n?|```$/g, '');
          
          // Try to extract JSON from the response if it's embedded in text
          const jsonMatch = cleanMessage.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanMessage = jsonMatch[0];
          }
          
          // Fix common JSON issues
          cleanMessage = cleanMessage
            .replace(/([{,]\s*)"([^"]+)":\s*"([^"]*?)"\s*([,}])/g, (match: string, prefix: string, key: string, value: string, suffix: string) => {
              // Escape quotes in values
              const escapedValue = value.replace(/"/g, '\\"');
              return `${prefix}"${key}": "${escapedValue}"${suffix}`;
            })
            .replace(/\n/g, '\\n')  // Escape newlines
            .replace(/\r/g, '\\r')  // Escape carriage returns
            .replace(/\t/g, '\\t'); // Escape tabs
          
          console.log('Attempting to parse cleaned JSON:', cleanMessage);
          
          // Try to parse as JSON
          const artwork = JSON.parse(cleanMessage);
          
          if (artwork.title && artwork.artist && artwork.description && artwork.hints) {
            // If no image URL provided, try to search for one
            if (!artwork.imageUrl) {
              artwork.imageUrl = await searchArtworkImage(artwork.title, artwork.artist);
            }
            return artwork;
          }
        } catch (error) {
          console.error('Failed to parse AI artwork response:', error);
          console.error('Raw response:', data.message);
          
          // Try one more fallback - attempt to extract individual fields using regex
          try {
            const titleMatch = data.message.match(/"title":\s*"([^"]+)"/);
            const artistMatch = data.message.match(/"artist":\s*"([^"]+)"/);
            const descriptionMatch = data.message.match(/"description":\s*"([^"]+)"/);
            const hintsMatch = data.message.match(/"hints":\s*\[([^\]]+)\]/);
            
            if (titleMatch && artistMatch && descriptionMatch && hintsMatch) {
              const hintsStr = hintsMatch[1];
              const hints = hintsStr.split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
              
              return {
                title: titleMatch[1],
                artist: artistMatch[1],
                description: descriptionMatch[1],
                hints: hints,
                difficulty: currentDifficulty,
                imageUrl: undefined as string | undefined
              };
            }
          } catch (regexError) {
            console.error('Regex fallback also failed:', regexError);
          }
        }
      }
      
      // Fallback to predefined artwork
      const fallbackList = FALLBACK_ARTWORKS[currentDifficulty];
      return fallbackList[Math.floor(Math.random() * fallbackList.length)];
      
    } catch (error) {
      console.error('Failed to generate artwork:', error);
      // Fallback to predefined artwork
      const fallbackList = FALLBACK_ARTWORKS[currentDifficulty];
      return fallbackList[Math.floor(Math.random() * fallbackList.length)];
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Start new game
  const startNewGame = async () => {
    const artwork = await generateArtwork(state.difficulty);
    if (artwork) {
      setState(prev => ({
        ...prev,
        currentArtwork: artwork,
        currentHintIndex: 0,
        userGuess: '',
        gameActive: true,
        showAnswer: false,
        hintsUsed: 0,
        // Add current artwork to history to prevent repetition
        artworkHistory: [
          ...prev.artworkHistory,
          { title: artwork.title, artist: artwork.artist }
        ].slice(-10) // Keep only last 10 artworks to prevent memory bloat
      }));
    }
  };

  // Check answer
  const checkAnswer = () => {
    if (!state.currentArtwork || state.userGuess.trim() === '') return;

    const guess = state.userGuess.toLowerCase().trim();
    const correctTitle = state.currentArtwork.title.toLowerCase();
    const correctArtist = state.currentArtwork.artist.toLowerCase();

    let isCorrect = false;
    
    if (state.gameMode === 'guess-title') {
      isCorrect = guess.includes(correctTitle) || correctTitle.includes(guess);
    } else if (state.gameMode === 'guess-artist') {
      isCorrect = guess.includes(correctArtist) || correctArtist.includes(guess);
    } else { // mixed mode
      isCorrect = guess.includes(correctTitle) || correctTitle.includes(guess) ||
                  guess.includes(correctArtist) || correctArtist.includes(guess);
    }

    const newScore = isCorrect ? state.score + (5 - state.hintsUsed) : state.score;
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const newBestStreak = Math.max(state.bestStreak, newStreak);

    setState(prev => ({
      ...prev,
      score: newScore,
      totalGames: prev.totalGames + 1,
      streak: newStreak,
      bestStreak: newBestStreak,
      showAnswer: true,
      gameActive: false,
    }));

    saveStats();
  };

  // Get next hint
  const getNextHint = () => {
    if (state.currentArtwork && state.currentHintIndex < state.currentArtwork.hints.length - 1) {
      setState(prev => ({
        ...prev,
        currentHintIndex: prev.currentHintIndex + 1,
        hintsUsed: prev.hintsUsed + 1,
      }));
    }
  };

  // Reset game
  const resetGame = () => {
    setState(prev => ({
      ...prev,
      currentArtwork: null,
      gameActive: false,
      showAnswer: false,
      userGuess: '',
      currentHintIndex: 0,
      hintsUsed: 0,
    }));
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.gameActive && state.userGuess.trim() !== '') {
      checkAnswer();
    }
  };

  return (
    <div className="art-critic-game p-6 max-w-4xl mx-auto min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100">
      <div className="header text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">🎨 AI Art Critic</h1>
        <p className="text-lg text-gray-700">Guess the famous artwork from AI descriptions!</p>
      </div>

      {!state.gameActive && !state.showAnswer && (
        <div className="setup-screen space-y-6">
          {/* Game Mode Selection */}
          <div className="game-mode-selection">
            <h3 className="text-xl font-semibold mb-3 text-center">Choose Your Challenge</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                { mode: 'guess-title' as const, label: 'Guess Title', desc: 'Identify the artwork' },
                { mode: 'guess-artist' as const, label: 'Guess Artist', desc: 'Name the creator' },
                { mode: 'mixed' as const, label: 'Mixed Mode', desc: 'Either title or artist' },
              ].map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => setState(prev => ({ ...prev, gameMode: mode }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    state.gameMode === mode
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
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
            <h3 className="text-xl font-semibold mb-3 text-center">Difficulty Level</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                { diff: 'easy' as const, label: 'Easy', desc: 'Famous masterpieces' },
                { diff: 'medium' as const, label: 'Medium', desc: 'Well-known works' },
                { diff: 'hard' as const, label: 'Hard', desc: 'Art history deep cuts' },
              ].map(({ diff, label, desc }) => (
                <button
                  key={diff}
                  onClick={() => setState(prev => ({ ...prev, difficulty: diff }))}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    state.difficulty === diff
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-gray-600">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Display */}
          <div className="stats-display bg-white/80 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Your Art Knowledge</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{state.score}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">{state.bestStreak}</div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{state.totalGames}</div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
            </div>
          </div>

          <button
            onClick={startNewGame}
            disabled={state.loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
          >
            {state.loading ? 'Generating Artwork...' : 'Start Art Critique'}
          </button>
        </div>
      )}

      {state.gameActive && state.currentArtwork && (
        <div className="game-screen">
          {/* Game Header */}
          <div className="game-header bg-white/80 p-4 rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center">
              <div className="game-mode">
                <span className="text-sm text-gray-600">Mode: </span>
                <span className="font-semibold text-purple-700 capitalize">
                  {state.gameMode.replace('-', ' ')}
                </span>
              </div>
              <div className="stats flex gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{state.score}</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-pink-600">{state.streak}</div>
                  <div className="text-xs text-gray-600">Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Art Description and Image */}
          <div className="art-section grid md:grid-cols-2 gap-6 mb-6">
            {/* Artwork Image */}
            <div className="artwork-image bg-white/90 p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center text-purple-700">
                🖼️ The Artwork
              </h3>
              {state.currentArtwork.imageUrl ? (
                <img
                  src={state.currentArtwork.imageUrl}
                  alt="Artwork to identify"
                  className="w-full h-auto max-h-80 object-contain rounded-lg shadow-md border border-gray-200"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x300/f3e8ff/8b5cf6?text=${encodeURIComponent(state.currentArtwork?.title.substring(0, 20) || 'Artwork')}`;
                  }}
                />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-2">🎨</div>
                    <div className="text-lg font-medium">Artwork Image</div>
                    <div className="text-sm">Use the description to identify the piece</div>
                  </div>
                </div>
              )}
            </div>

            {/* Art Description */}
            <div className="art-description bg-white/90 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center text-purple-700">
                📝 The AI Art Critic Says...
              </h3>
              <p className="text-base leading-relaxed text-gray-800 italic border-l-4 border-purple-300 pl-4">
                "{state.currentArtwork.description}"
              </p>
            </div>
          </div>

          {/* Hints */}
          {state.currentHintIndex >= 0 && (
            <div className="hints-section bg-indigo-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2 text-indigo-700">💡 Hints Used ({state.hintsUsed + 1}/4):</h4>
              {state.currentArtwork.hints.slice(0, state.currentHintIndex + 1).map((hint, index) => (
                <div key={index} className="hint-item p-2 bg-white rounded mb-2">
                  <span className="text-sm font-semibold text-indigo-600">#{index + 1}: </span>
                  <span className="text-gray-700">{hint}</span>
                </div>
              ))}
              
              {state.currentHintIndex < state.currentArtwork.hints.length - 1 && (
                <button
                  onClick={getNextHint}
                  className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                >
                  Get Next Hint (-1 point)
                </button>
              )}
            </div>
          )}

          {/* Answer Input */}
          <div className="answer-section bg-white/90 p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold mb-4 text-center">
              {state.gameMode === 'guess-title' ? 'What is the title of this artwork?' :
               state.gameMode === 'guess-artist' ? 'Who created this artwork?' :
               'What is the title or who is the artist?'}
            </h4>
            
            <div className="flex gap-4">
              <input
                type="text"
                value={state.userGuess}
                onChange={(e) => setState(prev => ({ ...prev, userGuess: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Enter your guess..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                autoFocus
              />
              <button
                onClick={checkAnswer}
                disabled={state.userGuess.trim() === ''}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
              >
                Submit
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={resetGame}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
              >
                Skip This Artwork
              </button>
            </div>
          </div>
        </div>
      )}

      {state.showAnswer && state.currentArtwork && (
        <div className="answer-screen bg-white/90 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">
            {state.userGuess.toLowerCase().includes(state.currentArtwork.title.toLowerCase()) ||
             state.userGuess.toLowerCase().includes(state.currentArtwork.artist.toLowerCase()) ? 
             '🎉 Correct!' : '❌ Not Quite!'}
          </h2>

          <div className="artwork-reveal grid md:grid-cols-2 gap-6 mb-6">
            {/* Artwork Image */}
            <div className="text-center">
              {state.currentArtwork.imageUrl ? (
                <img
                  src={state.currentArtwork.imageUrl}
                  alt={`${state.currentArtwork.title} by ${state.currentArtwork.artist}`}
                  className="w-full h-auto max-h-80 object-contain rounded-lg shadow-md border border-gray-200 mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x300/f3e8ff/8b5cf6?text=${encodeURIComponent(state.currentArtwork?.title.substring(0, 20) || 'Artwork')}`;
                  }}
                />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg shadow-md border border-gray-200 flex items-center justify-center mx-auto">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-2">🎨</div>
                    <div className="text-lg font-medium">Artwork</div>
                  </div>
                </div>
              )}
            </div>

            {/* Artwork Details */}
            <div className="text-center md:text-left flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-purple-700 mb-2">
                "{state.currentArtwork.title}"
              </h3>
              <p className="text-xl text-gray-700 mb-4">
                by {state.currentArtwork.artist}
              </p>
              <p className="text-gray-600 italic mb-4">
                Your guess: "{state.userGuess}"
              </p>
              <div className="text-sm text-gray-500">
                Difficulty: <span className="capitalize font-medium">{state.currentArtwork.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="score-summary bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg mb-6">
            <div className="text-center">
              <div className="text-lg">
                Points earned: {state.userGuess.toLowerCase().includes(state.currentArtwork.title.toLowerCase()) ||
                                state.userGuess.toLowerCase().includes(state.currentArtwork.artist.toLowerCase()) ? 
                                (5 - state.hintsUsed) : 0}
              </div>
              <div className="text-sm text-gray-600">
                (Base 5 points - {state.hintsUsed} hints used)
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              Next Artwork
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Change Settings
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions mt-8 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
          <span className="mr-2">📚</span>
          How to Play Art Critic
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-700">
          <div>
            <h4 className="font-semibold text-purple-600 mb-2">🎯 Objective</h4>
            <p className="text-sm mb-3">View the artwork image and read the AI's description of famous artworks, then guess the title or artist!</p>
            
            <h4 className="font-semibold text-purple-600 mb-2">🎮 Game Modes</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Guess Title:</strong> Identify the artwork's name</li>
              <li>• <strong>Guess Artist:</strong> Name who created it</li>
              <li>• <strong>Mixed:</strong> Either title or artist counts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-600 mb-2">⚡ Scoring</h4>
            <ul className="text-sm space-y-1">
              <li>• Base score: 5 points per correct guess</li>
              <li>• Hints reduce your score by 1 point each</li>
              <li>• Build streaks for bonus points!</li>
              <li>• Partial matches (title OR artist) count!</li>
            </ul>
            
            <h4 className="font-semibold text-purple-600 mb-2 mt-3">💡 Tips</h4>
            <ul className="text-sm space-y-1">
              <li>• Study the image and AI description together</li>
              <li>• Use hints wisely - they cost points</li>
              <li>• Both title and artist names count as correct</li>
              <li>• Try different difficulty levels for variety</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
