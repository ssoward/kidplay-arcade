import React, { useState, useEffect, useRef } from 'react';

interface GameState {
  currentSong: {
    artist: string;
    title: string;
    year: number;
    genre: string;
    description: string;
    audioUrl?: string;
  } | null;
  userGuess: {
    artist: string;
    title: string;
  };
  loading: boolean;
  showAnswer: boolean;
  score: number;
  totalSongs: number;
  correctGuesses: number;
  yearRange: string;
  selectedGenre: string;
  streak: number;
  bestStreak: number;
  audioLoading: boolean;
  audioError: string | null;
  hint: string | null;
  hintLoading: boolean;
  hintUsed: boolean;
}

interface GameStats {
  totalSongs: number;
  correctGuesses: number;
  bestStreak: number;
  accuracyRate: number;
  favoriteGenre: string;
  totalScore: number;
}

const RadioSongGuess: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Add ref for active request controllers
  const activeRequestsRef = useRef<{
    song?: AbortController;
    audio?: AbortController;
    hint?: AbortController;
  }>({});
  
  const [state, setState] = useState<GameState>({
    currentSong: null,
    userGuess: { artist: '', title: '' },
    loading: false,
    showAnswer: false,
    score: 0,
    totalSongs: 0,
    correctGuesses: 0,
    yearRange: '2010s',
    selectedGenre: 'pop',
    streak: 0,
    bestStreak: 0,
    audioLoading: false,
    audioError: null,
    hint: null,
    hintLoading: false,
    hintUsed: false
  });

  const [stats, setStats] = useState<GameStats>({
    totalSongs: 0,
    correctGuesses: 0,
    bestStreak: 0,
    accuracyRate: 0,
    favoriteGenre: 'pop',
    totalScore: 0
  });

  const [usedSongs, setUsedSongs] = useState<{artist: string, title: string}[]>([]);

  // Helper function for fetch with timeout
  async function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout: number = 8000) {
    const controller = new AbortController();
    const userSignal = options.signal;
    
    // Create a combined controller that aborts if either the timeout or the user aborts
    const signal = controller.signal;
    
    // Set up timeout
    const id = setTimeout(() => controller.abort(), timeout);
    
    // Handle user abort signal if provided
    let userAbortListener: ((event: Event) => void) | undefined;
    if (userSignal) {
      userAbortListener = () => controller.abort();
      userSignal.addEventListener('abort', userAbortListener);
    }
    
    try {
      const response = await fetch(resource, {
        ...options,
        signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    } finally {
      // Clean up event listener if one was added
      if (userSignal && userAbortListener) {
        userSignal.removeEventListener('abort', userAbortListener);
      }
    }
  }

  const yearRanges = [
    { value: '2020s', label: '2020s (Recent Hits)' },
    { value: '2010s', label: '2010s (Golden Era)' },
    { value: '2000s', label: '2000s (Classics)' },
    { value: '1990s', label: '1990s (Nostalgic)' },
    { value: '1980s', label: '1980s (Retro)' },
    { value: '1970s', label: '1970s (Disco & Rock)' },
    { value: 'mixed', label: 'Mixed (All Eras)' }
  ];

  const genres = [
    'pop', 'rock', 'hip-hop', 'country', 'r&b', 'electronic', 'indie', 'alternative', 'classic rock', 'disney'
  ];

  useEffect(() => {
    const savedStats = localStorage.getItem('radioSongGuess-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    
    // Cleanup function to abort all pending requests when component unmounts
    return () => {
      if (activeRequestsRef.current.song) activeRequestsRef.current.song.abort();
      if (activeRequestsRef.current.audio) activeRequestsRef.current.audio.abort();
      if (activeRequestsRef.current.hint) activeRequestsRef.current.hint.abort();
    };
  }, []);

  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    localStorage.setItem('radioSongGuess-stats', JSON.stringify(newStats));
  };

  const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
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

  const isFuzzyMatch = (guess: string, answer: string): boolean => {
    const g = guess.trim().toLowerCase();
    const a = answer.trim().toLowerCase();
    if (!g || !a) return false;
    if (g === a) return true;
    // Allow for small Levenshtein distance (1 for short, 2 for longer)
    const maxDist = a.length > 6 ? 2 : 1;
    if (levenshtein(g, a) <= maxDist) return true;
    // Allow if all words in guess are in answer (subset)
    const gWords = g.split(/\s+/);
    const aWords = a.split(/\s+/);
    if (gWords.every(word => aWords.includes(word))) return true;
    if (aWords.every(word => gWords.includes(word))) return true;
    // Allow if guess is substring of answer or vice versa
    if (a.includes(g) || g.includes(a)) return true;
    return false;
  };

  const generateSong = async () => {
    // Cancel any active song request
    if (activeRequestsRef.current.song) {
      activeRequestsRef.current.song.abort();
    }
    if (activeRequestsRef.current.audio) {
      activeRequestsRef.current.audio.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    activeRequestsRef.current.song = abortController;
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      showAnswer: false, 
      userGuess: { artist: '', title: '' },
      currentSong: null,
      hint: null,
      hintUsed: false,
      hintLoading: false,
      audioLoading: false,
      audioError: null
    }));

    let attempts = 0;
    const maxAttempts = 5;
    let newSong: any = null;
    let lastError: any = null;
    while (attempts < maxAttempts && !newSong) {
      attempts++;
      try {
        // Build history of used songs for the AI prompt
        const usedSongsHistory = usedSongs.length > 0 
          ? `\n\nIMPORTANT: Do NOT repeat any of these previously used songs:\n${usedSongs.map(song => `- "${song.title}" by ${song.artist}`).join('\n')}\n\nPick a completely different song that hasn't been used yet.`
          : '';

        const prompt = `Generate a real, popular song from the ${state.yearRange} era in the ${state.selectedGenre} genre that would be appropriate for kids to know about. 
        Create a fun, descriptive clue about the song without mentioning the artist name or song title directly.${usedSongsHistory}
        
        IMPORTANT: Choose songs that are family-friendly and appropriate for children. Avoid songs with:
        - Explicit language or profanity
        - Sexual content or suggestive themes
        - Violence or inappropriate subject matter
        - Drug or alcohol references
        - Any content that would not be suitable for kids under 13
        
        ${state.selectedGenre === 'disney' ? 
        'For Disney songs, choose from classic Disney animated movies, Pixar films, Disney Channel movies, or Disney live-action films. Include songs from movies like The Little Mermaid, Lion King, Frozen, Moana, Encanto, Aladdin, Beauty and the Beast, Toy Story, etc.' : 
        ''}
        
        Format your response as JSON:
        {
          "artist": "Artist Name",
          "title": "Song Title", 
          "year": 2010,
          "genre": "${state.selectedGenre}",
          "description": "A fun, kid-friendly description of the song that gives clues about its style, mood, instruments, or what it's about WITHOUT saying the artist or title. Make it challenging but fair for kids."
        }
        
        Make sure the song is:
        - Actually a real, well-known song
        - Completely appropriate for children (clean lyrics, positive themes, family-friendly content)
        - From the requested era and genre
        - Something kids might recognize from radio, movies, or popular culture
        - Free of any explicit content, profanity, or inappropriate themes
        - NOT one of the previously used songs listed above`;

        const response = await fetch('/api/ask-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: [{ role: 'user', content: prompt }]
          }),
          signal: abortController.signal
        });

        if (!response.ok) throw new Error('Failed to generate song');

        const data = await response.json();
        let jsonText = data.message || data.response || data.content;
        if (!jsonText || typeof jsonText !== 'string') {
          if (data.artist && data.title && data.description) {
            jsonText = JSON.stringify(data);
          } else {
            throw new Error('Empty or invalid response from API');
          }
        }
        const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
        const objectMatch = jsonText.match(/\{[\s\S]*?\}/);
        if (objectMatch && !jsonMatch) {
          jsonText = objectMatch[0];
        }
        const songData = JSON.parse(jsonText);
        if (!songData.artist || !songData.title || !songData.description) {
          throw new Error('Missing required fields in response');
        }
        // Check for repeat
        const alreadyUsed = usedSongs.some(s =>
          isFuzzyMatch(s.artist, songData.artist) && isFuzzyMatch(s.title, songData.title)
        );
        if (alreadyUsed) {
          lastError = 'Repeat song, retrying...';
          continue;
        }
        newSong = {
          artist: songData.artist,
          title: songData.title,
          year: songData.year || 2020,
          genre: songData.genre || state.selectedGenre,
          description: songData.description
        };
        setState(prev => ({
          ...prev,
          currentSong: newSong,
          loading: false,
          totalSongs: prev.totalSongs + 1
        }));
        setUsedSongs(prev => [...prev, { artist: newSong.artist, title: newSong.title }]);
        searchAudioPreview(newSong.artist, newSong.title);
      } catch (error) {
        lastError = error;
        if (attempts >= maxAttempts) {
          // fallback - make sure we have a more comprehensive list
          const fallbackSongs = [
            {
              artist: "Ed Sheeran",
              title: "Shape of You",
              year: 2017,
              genre: "pop",
              description: "This upbeat song has a tropical feel with acoustic guitar and talks about dancing and being attracted to someone. It was one of the biggest hits of the 2010s!",
              audioUrl: undefined
            },
            {
              artist: "Taylor Swift",
              title: "Shake It Off",
              year: 2014,
              genre: "pop",
              description: "An energetic, feel-good anthem about ignoring negative comments and just having fun. It features hand claps and a catchy chorus that makes you want to dance!",
              audioUrl: undefined
            },
            {
              artist: "Imagine Dragons",
              title: "Thunder",
              year: 2017,
              genre: "rock",
              description: "This song combines electronic beats with rock elements and talks about dreams coming true. It has a distinctive vocal effect and weather-related lyrics.",
              audioUrl: undefined
            },
            {
              artist: "Bruno Mars",
              title: "Uptown Funk",
              year: 2014,
              genre: "pop",
              description: "A funky, retro-style dance song with horns and a groove that makes everyone want to move. It's all about having fun and looking good!",
              audioUrl: undefined
            },
            {
              artist: "Pharrell Williams",
              title: "Happy",
              year: 2013,
              genre: "pop",
              description: "An incredibly upbeat and joyful song that literally tells you to clap along if you feel happiness. It was featured in a popular animated movie!",
              audioUrl: undefined
            },
            {
              artist: "Maroon 5",
              title: "Sugar",
              year: 2014,
              genre: "pop",
              description: "A sweet love song with an upbeat tempo. The music video became famous for surprise wedding performances!",
              audioUrl: undefined
            },
            // Disney Songs
            {
              artist: "Idina Menzel",
              title: "Let It Go",
              year: 2013,
              genre: "disney",
              description: "A powerful anthem about freedom and self-acceptance from an icy animated movie. This song features soaring vocals and magical lyrics about embracing who you are!",
              audioUrl: undefined
            },
            {
              artist: "Lin-Manuel Miranda",
              title: "We Don't Talk About Bruno",
              year: 2021,
              genre: "disney",
              description: "A catchy, mysterious song about a family member with magical gifts that everyone whispers about. It's from a colorful animated movie about magical houses!",
              audioUrl: undefined
            },
            {
              artist: "Auli'i Cravalho",
              title: "How Far I'll Go",
              year: 2016,
              genre: "disney",
              description: "An inspiring song about adventure and following your dreams, sung by a brave island princess who loves the ocean. Features beautiful island-style music!",
              audioUrl: undefined
            },
            {
              artist: "Alan Menken",
              title: "A Whole New World",
              year: 1992,
              genre: "disney",
              description: "A romantic duet about exploring new possibilities and seeing things from a different perspective. Features a magical carpet ride through the stars!",
              audioUrl: undefined
            },
            {
              artist: "Elton John",
              title: "Can You Feel the Love Tonight",
              year: 1994,
              genre: "disney",
              description: "A beautiful love song from an African savanna adventure. This gentle ballad talks about romance under the stars with animal friends watching!",
              audioUrl: undefined
            },
            {
              artist: "Randy Newman",
              title: "You've Got a Friend in Me",
              year: 1995,
              genre: "disney",
              description: "A heartwarming song about friendship and loyalty between toys. This cheerful tune is all about being there for each other through thick and thin!",
              audioUrl: undefined
            }
          ];
          const foundFallback = fallbackSongs.find(fb => !usedSongs.some(s => isFuzzyMatch(s.artist, fb.artist) && isFuzzyMatch(s.title, fb.title)));
          const definiteFallback = foundFallback || fallbackSongs[0];

          setState(prev => ({
            ...prev,
            currentSong: definiteFallback,
            loading: false,
            totalSongs: prev.totalSongs + 1
          }));
          setUsedSongs(prev => [...prev, { artist: definiteFallback.artist, title: definiteFallback.title }]);
        }
      }
    }
  };

  const submitGuess = () => {
    if (!state.currentSong) { // Allow submission even if inputs are empty
      return;
    }

    // Fuzzy matching logic
    const artistGuess = state.userGuess.artist.trim();
    const titleGuess = state.userGuess.title.trim();
    
    const artistMatch = artistGuess ? isFuzzyMatch(artistGuess, state.currentSong.artist) : false;
    const titleMatch = titleGuess ? isFuzzyMatch(titleGuess, state.currentSong.title) : false;

    let points = 0;
    const isFullyCorrect = artistMatch && titleMatch; // For stats, full correctness means both.

    if (isFullyCorrect) {
      points = 10; // Full credit for fuzzy match on both
    } else if (artistMatch || titleMatch) {
      points = 3; // Partial credit if only artist OR only title is a fuzzy match
    }

    // Reduce points if hint was used
    if (state.hintUsed && points > 0) {
      points = Math.max(0, points - 2);
    }

    const newCorrectGuesses = state.correctGuesses + (isFullyCorrect ? 1 : 0); // Stats track full correct guesses
    const newStreak = isFullyCorrect ? state.streak + 1 : 0;
    const newBestStreak = Math.max(state.bestStreak, newStreak);

    const newStats: GameStats = {
      totalSongs: stats.totalSongs + 1,
      correctGuesses: stats.correctGuesses + (isFullyCorrect ? 1 : 0), // Stats track full correct guesses
      bestStreak: Math.max(stats.bestStreak, newStreak),
      accuracyRate: ((stats.correctGuesses + (isFullyCorrect ? 1 : 0)) / (stats.totalSongs + 1)) * 100,
      favoriteGenre: state.selectedGenre,
      totalScore: stats.totalScore + points
    };

    setState(prev => ({
      ...prev,
      showAnswer: true,
      score: prev.score + points,
      correctGuesses: newCorrectGuesses, // This reflects fully correct guesses for the session
      streak: newStreak,
      bestStreak: newBestStreak
    }));

    saveStats(newStats);
  };

  const nextSong = () => {
    // Immediately reset current song state to avoid stale UI
    setState(prev => ({
      ...prev,
      currentSong: null,
      loading: true,
      showAnswer: false,
      userGuess: { artist: '', title: '' },
      hint: null,
      hintUsed: false,
      hintLoading: false,
      audioLoading: false,
      audioError: null
    }));
    
    // Small delay to ensure UI updates before potentially heavy operation
    setTimeout(() => {
      generateSong();
    }, 10);
  };

  const resetGame = () => {
    setState({
      currentSong: null,
      userGuess: { artist: '', title: '' },
      loading: false,
      showAnswer: false,
      score: 0,
      totalSongs: 0,
      correctGuesses: 0,
      yearRange: '2010s',
      selectedGenre: 'pop',
      streak: 0,
      bestStreak: 0,
      audioLoading: false,
      audioError: null,
      hint: null,
      hintLoading: false,
      hintUsed: false
    });
    setUsedSongs([]);
  };

  const getAccuracyRate = () => {
    return state.totalSongs > 0 ? ((state.correctGuesses / state.totalSongs) * 100).toFixed(1) : '0.0';
  };

  // Function to search for audio preview using iTunes API (free alternative to Spotify)
  const searchAudioPreview = async (artist: string, title: string) => {
    // Cancel any active audio request
    if (activeRequestsRef.current.audio) {
      activeRequestsRef.current.audio.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    activeRequestsRef.current.audio = abortController;
    
    setState(prev => ({ ...prev, audioLoading: true, audioError: null }));
    
    try {
      const searchQuery = `${artist} ${title}`;
      
      // Add retry logic with backoff
      let attempts = 0;
      const maxAttempts = 2;
      let lastError: Error | null = null;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const timeout = attempts === 1 ? 8000 : 4000; // shorter timeout on retry
          
          // Use backend proxy instead of direct iTunes API call to avoid CORS issues on mobile
          const response = await fetchWithTimeout(
            `/api/itunes-search?term=${encodeURIComponent(searchQuery)}&media=music&entity=song&limit=5`, 
            { signal: abortController.signal }, 
            timeout
          );
          
          // If successful, process the response
          if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              // Find the best match by looking for exact or close matches
              const bestMatch = data.results.find((track: any) => 
                track.artistName.toLowerCase().includes(artist.toLowerCase()) &&
                track.trackName.toLowerCase().includes(title.toLowerCase())
              ) || data.results[0]; // Fallback to first result
              
              if (bestMatch && bestMatch.previewUrl) {
                setState(prev => ({
                  ...prev,
                  currentSong: prev.currentSong ? {
                    ...prev.currentSong,
                    audioUrl: bestMatch.previewUrl
                  } : null,
                  audioLoading: false
                }));
                return; // Success! Exit the function
              } else {
                throw new Error('No audio preview available');
              }
            } else {
              throw new Error('Song not found in music database');
            }
          } else {
            throw new Error(`Audio search failed with status: ${response.status}`);
          }
        } catch (error: any) {
          lastError = error;
          
          // If aborted or on final attempt, don't retry
          if (abortController.signal.aborted || attempts >= maxAttempts) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      // If we get here, all attempts failed
      throw lastError || new Error('Failed to fetch audio preview');
    } catch (error: any) {
      console.error('Audio search error:', error);
      let errorMessage = 'Audio preview not available for this song.';
      
      // Only update state if the component is still mounted and request wasn't aborted
      if (!abortController.signal.aborted) {
        if (error.name === 'AbortError') {
          errorMessage = 'Audio search timed out. Please try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        setState(prev => ({
          ...prev,
          audioLoading: false,
          audioError: errorMessage
        }));
      }
    } finally {
      // Clean up the abort controller reference if it's the current one
      if (activeRequestsRef.current.audio === abortController) {
        activeRequestsRef.current.audio = undefined;
      }
    }
  };

  const playAudioPreview = () => {
    if (audioRef.current && state.currentSong?.audioUrl) {
      audioRef.current.currentTime = 0; // Start from beginning
      audioRef.current.play().catch(error => {
        console.error('Audio play error:', error);
        setState(prev => ({ ...prev, audioError: 'Could not play audio' }));
      });
    }
  };

  const pauseAudioPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const getAIHint = async () => {
    if (!state.currentSong) return;
    
    // Cancel any active hint request
    if (activeRequestsRef.current.hint) {
      activeRequestsRef.current.hint.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    activeRequestsRef.current.hint = abortController;
    
    setState(prev => ({ ...prev, hintLoading: true }));
    
    try {
      const prompt = `You are helping a player in a song guessing game. They have this song description: "${state.currentSong.description}"

The correct answer is "${state.currentSong.title}" by ${state.currentSong.artist} from ${state.currentSong.year}.

Provide ONE additional helpful hint that gives more clues without directly revealing the artist name or song title. The hint should be:
- Kid-friendly and encouraging
- About 1-2 sentences long
- Give clues about the song's popularity, chart position, awards, movie/TV appearances, or distinctive musical elements
- NOT mention the exact artist name or song title
- Help narrow down the guess without giving it away completely

Format your response as a simple text hint, not JSON.`;

      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [{ role: 'user', content: prompt }]
        }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error('Failed to get hint');

      const data = await response.json();
      const hintText = data.message || data.response || data.content || 'Try thinking about popular songs from this era and genre!';
      
      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          hint: hintText,
          hintLoading: false,
          hintUsed: true
        }));
      }

    } catch (error: any) {
      console.error('Error getting hint:', error);
      
      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          hint: 'Try thinking about the most popular songs from this era and genre. Listen carefully to any musical clues in the description!',
          hintLoading: false,
          hintUsed: true
        }));
      }
    } finally {
      // Clean up the abort controller reference if it's the current one
      if (activeRequestsRef.current.hint === abortController) {
        activeRequestsRef.current.hint = undefined;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎵 Song Quiz 📻</h1>
          <p className="text-white/90 text-lg">Listen to AI descriptions and guess the song!</p>
        </div>

        {/* Stats Panel */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{state.score}</div>
              <div className="text-white/80 text-sm">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{state.correctGuesses}/{state.totalSongs}</div>
              <div className="text-white/80 text-sm">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{getAccuracyRate()}%</div>
              <div className="text-white/80 text-sm">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{state.streak}</div>
              <div className="text-white/80 text-sm">Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{state.bestStreak}</div>
              <div className="text-white/80 text-sm">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Era/Decade
              </label>
              <select
                value={state.yearRange}
                onChange={(e) => setState(prev => ({ ...prev, yearRange: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={state.loading || (!!state.currentSong && !state.showAnswer)}
              >
                {yearRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                value={state.selectedGenre}
                onChange={(e) => setState(prev => ({ ...prev, selectedGenre: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={state.loading || (!!state.currentSong && !state.showAnswer)}
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {!state.currentSong ? (
            <button
              onClick={generateSong}
              disabled={state.loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {state.loading ? '🎵 Loading Song...' : '🎲 Get New Song'}
            </button>
          ) : null}
        </div>

        {/* Song Challenge */}
        {state.currentSong && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎧</div>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-2">Song Description:</h3>
                <p className="text-gray-700 leading-relaxed">
                  {state.currentSong.description}
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="mr-4">📅 Era: {state.yearRange}</span>
                  <span>🎭 Genre: {state.selectedGenre}</span>
                </div>
              </div>
              
              {/* Audio Controls */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3 text-center">🎵 Audio Preview</h3>
                {state.audioLoading ? (
                  <div className="text-center text-gray-600">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    Searching for audio preview...
                  </div>
                ) : state.audioError ? (
                  <div className="text-center text-gray-600">
                    <span className="text-yellow-600">⚠️ {state.audioError}</span>
                  </div>
                ) : state.currentSong?.audioUrl ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Listen to a 30-second preview to help with your guess!</p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={playAudioPreview}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        ▶️ Play Preview
                      </button>
                      <button
                        onClick={pauseAudioPreview}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        ⏸️ Pause
                      </button>
                    </div>
                    <audio
                      ref={audioRef}
                      src={state.currentSong.audioUrl}
                      preload="metadata"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    🔍 No audio preview found for this song
                  </div>
                )}
              </div>
              
              {!state.showAnswer ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Artist Name
                      </label>
                      <input
                        type="text"
                        value={state.userGuess.artist}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          userGuess: { ...prev.userGuess, artist: e.target.value }
                        }))}
                        placeholder="Enter artist name..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Song Title
                      </label>
                      <input
                        type="text"
                        value={state.userGuess.title}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          userGuess: { ...prev.userGuess, title: e.target.value }
                        }))}
                        placeholder="Enter song title..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* AI Hint Section */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-yellow-800">💡 Need a Hint?</h4>
                      {!state.hintUsed && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          -2 points if used
                        </span>
                      )}
                    </div>
                    
                    {!state.hint ? (
                      <button
                        onClick={getAIHint}
                        disabled={state.hintLoading || state.hintUsed}
                        className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {state.hintLoading ? (
                          <>
                            <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Getting Hint...
                          </>
                        ) : state.hintUsed ? (
                          '💡 Hint Used'
                        ) : (
                          '💡 Get AI Hint'
                        )}
                      </button>
                    ) : (
                      <div className="bg-yellow-100 rounded-lg p-3">
                        <p className="text-yellow-800 leading-relaxed">
                          <strong>Hint:</strong> {state.hint}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={submitGuess}
                    // disabled={!state.userGuess.artist.trim() || !state.userGuess.title.trim()} // Allow submission with empty inputs
                    className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🎯 Submit Guess
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg text-blue-800 mb-2">Correct Answer:</h3>
                    <p className="text-xl font-semibold text-blue-700">
                      "{state.currentSong.title}" by {state.currentSong.artist}
                    </p>
                    <p className="text-blue-600 mt-1">
                      Released in {state.currentSong.year}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    {(() => {
                      if (!state.currentSong || !state.showAnswer) return null;
                      
                      const artistGuess = state.userGuess.artist.trim();
                      const titleGuess = state.userGuess.title.trim();
                      const actualArtist = state.currentSong.artist;
                      const actualTitle = state.currentSong.title;

                      const artistMatch = artistGuess ? isFuzzyMatch(artistGuess, actualArtist) : false;
                      const titleMatch = titleGuess ? isFuzzyMatch(titleGuess, actualTitle) : false;
                      
                      const isFullyCorrect = artistMatch && titleMatch;

                      if (isFullyCorrect) {
                        return <p className="text-2xl font-bold text-green-600">🎉 Perfect! You got it! (+10 points)</p>;
                      } else if (artistMatch && !titleMatch) {
                        return <p className="text-2xl font-bold text-yellow-600">🤔 Partially Correct! You got the artist! (+3 points)</p>;
                      } else if (!artistMatch && titleMatch) {
                        return <p className="text-2xl font-bold text-yellow-600">🤔 Partially Correct! You got the title! (+3 points)</p>;
                      } else {
                        return <p className="text-2xl font-bold text-red-600">😥 Not quite right. Better luck next time!</p>;
                      }
                    })()}
                  </div>
                  
                  <button
                    onClick={nextSong}
                    className="bg-purple-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    🎵 Next Song
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={resetGame}
            className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Reset Game
          </button>
        </div>

        {/* Audio Preview - Hidden by default, shown when audio is available */}
        {state.currentSong?.audioUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">🎶 Audio Preview</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={playAudioPreview}
                className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
              >
                ▶️ Play Preview
              </button>
              <button
                onClick={pauseAudioPreview}
                className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ⏸️ Pause
              </button>
            </div>
            {state.audioLoading && <p className="text-gray-500 text-sm mt-2">Loading audio preview...</p>}
            {state.audioError && <p className="text-red-500 text-sm mt-2">{state.audioError}</p>}
          </div>
        )}

        {/* Audio element for playback, hidden from view */}
        <audio ref={audioRef} className="hidden">
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

export default RadioSongGuess;
