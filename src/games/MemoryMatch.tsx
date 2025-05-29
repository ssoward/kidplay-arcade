import React, { useState, useEffect } from 'react';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryMatch: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [bestScore, setBestScore] = useState<{[key: string]: number}>({});

  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧', '🐦', '🐤', '🐙', '🦄', '🦋', '🌺', '🌟', '⚡'];

  const difficultySettings = {
    easy: { pairs: 6, gridCols: 4, name: 'Easy', description: '6 pairs - Perfect for beginners' },
    medium: { pairs: 8, gridCols: 4, name: 'Medium', description: '8 pairs - Getting challenging' },
    hard: { pairs: 12, gridCols: 4, name: 'Hard', description: '12 pairs - Memory master level' }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !gameComplete) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameComplete]);

  // Load best scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('memoryMatch-bestScores');
    if (saved) {
      setBestScore(JSON.parse(saved));
    }
  }, []);

  const initializeGame = () => {
    const { pairs } = difficultySettings[difficulty];
    const gameEmojis = emojis.slice(0, pairs);
    const cardPairs = [...gameEmojis, ...gameEmojis];
    
    // Shuffle cards
    const shuffledCards = cardPairs
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameComplete(false);
    setTimer(0);
    setIsRunning(false);
  };

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find(card => card.id === firstId);
      const secondCard = cards.find(card => card.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => prev + 1);
          setFlippedCards([]);
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    const { pairs } = difficultySettings[difficulty];
    if (matches === pairs) {
      setGameComplete(true);
      setIsRunning(false);
      
      // Save best score
      const currentScore = moves;
      const currentBest = bestScore[difficulty];
      if (!currentBest || currentScore < currentBest) {
        const newBestScore = { ...bestScore, [difficulty]: currentScore };
        setBestScore(newBestScore);
        localStorage.setItem('memoryMatch-bestScores', JSON.stringify(newBestScore));
      }
    }
  }, [matches, difficulty, moves, bestScore]);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Start timer on first move
    if (moves === 0 && !isRunning) {
      setIsRunning(true);
    }

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const getStarRating = () => {
    const { pairs } = difficultySettings[difficulty];
    const perfectMoves = pairs;
    const goodMoves = pairs * 1.5;
    
    if (moves <= perfectMoves) return 3;
    if (moves <= goodMoves) return 2;
    return 1;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCardFlipAnimation = (card: Card) => {
    if (card.isMatched) return 'animate-pulse';
    if (card.isFlipped) return 'animate-bounce';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">🧠 Memory Match</h1>
          <p className="text-xl text-gray-600">Test your memory and find all matching pairs!</p>
        </div>

        {/* Game Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          {/* Difficulty Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Choose Difficulty</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(difficultySettings).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key as 'easy' | 'medium' | 'hard')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    difficulty === key
                      ? 'border-purple-500 bg-purple-100 text-purple-800 shadow-md'
                      : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                  }`}
                >
                  <div className="font-bold text-lg">{config.name}</div>
                  <div className="text-sm opacity-75">{config.description}</div>
                  {bestScore[key] && (
                    <div className="text-xs mt-1 text-green-600 font-medium">
                      Best: {bestScore[key]} moves
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-sm font-medium text-blue-600">Time</div>
              <div className="text-xl font-bold text-blue-800">{formatTime(timer)}</div>
            </div>
            
            <div className="bg-green-100 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm font-medium text-green-600">Moves</div>
              <div className="text-xl font-bold text-green-800">{moves}</div>
            </div>

            <div className="bg-yellow-100 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm font-medium text-yellow-600">Matches</div>
              <div className="text-xl font-bold text-yellow-800">
                {matches} / {difficultySettings[difficulty].pairs}
              </div>
            </div>

            <div className="bg-purple-100 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm font-medium text-purple-600">Best</div>
              <div className="text-xl font-bold text-purple-800">
                {bestScore[difficulty] || '-'}
              </div>
            </div>
          </div>

          {/* New Game Button */}
          <div className="text-center">
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              🔄 New Game
            </button>
          </div>

          {/* Game Complete Message */}
          {gameComplete && (
            <div className="mt-6 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-2xl font-bold text-green-800 mb-2">
                Congratulations!
              </div>
              <div className="text-lg text-green-700 mb-3">
                You completed the game in {moves} moves and {formatTime(timer)}!
              </div>
              <div className="text-3xl mb-2">
                {'⭐'.repeat(getStarRating())}
              </div>
              {bestScore[difficulty] === moves && (
                <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
                  🏆 New Best Score!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div 
            className="grid gap-4 justify-center"
            style={{
              gridTemplateColumns: `repeat(${difficultySettings[difficulty].gridCols}, minmax(0, 1fr))`,
              maxWidth: difficulty === 'hard' ? '600px' : '500px',
              margin: '0 auto'
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className={`
                  relative cursor-pointer select-none transition-all duration-300 transform hover:scale-105
                  ${card.isMatched ? 'opacity-75' : 'hover:shadow-lg'}
                  ${getCardFlipAnimation(card)}
                `}
                style={{
                  aspectRatio: '1',
                  minHeight: '80px',
                  maxHeight: '120px'
                }}
                onClick={() => handleCardClick(card.id)}
              >
                <div className={`
                  w-full h-full rounded-xl border-2 transition-all duration-500 transform-style-preserve-3d
                  ${card.isFlipped || card.isMatched 
                    ? 'rotate-y-180 border-purple-300' 
                    : 'border-gray-300 hover:border-purple-400'
                  }
                `}>
                  {/* Card Back */}
                  <div className={`
                    absolute inset-0 w-full h-full rounded-xl backface-hidden
                    bg-gradient-to-br from-purple-400 to-pink-400 
                    flex items-center justify-center text-white text-2xl font-bold
                    shadow-md
                    ${card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'}
                  `}>
                    🎴
                  </div>
                  
                  {/* Card Front */}
                  <div className={`
                    absolute inset-0 w-full h-full rounded-xl backface-hidden rotate-y-180
                    ${card.isMatched 
                      ? 'bg-gradient-to-br from-green-200 to-green-300' 
                      : 'bg-gradient-to-br from-blue-200 to-purple-200'
                    }
                    flex items-center justify-center text-4xl
                    shadow-md border-2
                    ${card.isMatched ? 'border-green-400' : 'border-blue-300'}
                    ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}
                  `}>
                    <span className="drop-shadow-lg">{card.emoji}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🎮 How to Play</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Game Rules:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Click any card to flip it and reveal the emoji
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Click a second card to try to find a match
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  If they match, both cards stay revealed
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  If they don't match, both cards flip back over
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Scoring:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⭐⭐⭐</span>
                  Perfect score (minimum moves)
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⭐⭐</span>
                  Good score (1.5x minimum moves)
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⭐</span>
                  Completed the game
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">🏆</span>
                  Your best scores are saved automatically
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryMatch;
