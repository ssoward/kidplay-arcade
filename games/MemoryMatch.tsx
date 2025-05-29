import React, { useState, useEffect } from 'react';
// import './Chess.css';

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

  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧', '🐦', '🐤'];

  const difficultySettings = {
    easy: { pairs: 6, gridCols: 3 },
    medium: { pairs: 8, gridCols: 4 },
    hard: { pairs: 12, gridCols: 4 }
  };

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
    }
  }, [matches, difficulty]);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

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

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Memory Palace 🧠</h1>
        <p className="text-lg opacity-90">Match all the pairs! Sharpen your memory and beat your best score.</p>
      </div>
      <div className="mb-6 text-center">
        <div className="bg-white/80 rounded-full p-1 inline-flex shadow">
          {Object.keys(difficultySettings).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff as 'easy' | 'medium' | 'hard')}
              className={`chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2`}
            >
              {diff} ({difficultySettings[diff as keyof typeof difficultySettings].pairs} pairs)
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 text-center max-w-xs mx-auto">
        <div className="bg-blue-100 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-600">Moves</div>
          <div className="text-2xl font-semibold">{moves}</div>
        </div>
        <div className="bg-green-100 rounded-lg p-3">
          <div className="text-lg font-bold text-green-600">Matches</div>
          <div className="text-2xl font-semibold">{matches} / {difficultySettings[difficulty].pairs}</div>
        </div>
      </div>
      {gameComplete && (
        <div className="mb-6 text-center bg-yellow-100 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-800 mb-2">
            Congratulations! 🎉
          </div>
          <div className="text-lg text-yellow-700 mb-2">
            You completed the game in {moves} moves!
          </div>
          <div className="text-2xl">
            {'⭐'.repeat(getStarRating())}
          </div>
        </div>
      )}
      <div className="memory-board" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${difficultySettings[difficulty].gridCols}, minmax(80px, 1fr))`,
        gap: '4vw',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4vw',
        maxWidth: '100vw',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`memory-card${card.isFlipped || card.isMatched ? ' flipped' : ''}`}
            style={{
              width: '100%',
              aspectRatio: '3/4',
              maxWidth: '140px',
              minWidth: '60px',
              background: card.isMatched ? '#e0ffe0' : '#fff',
              border: '2px solid #333',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
              fontSize: '2.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: card.isMatched ? 'default' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              imageRendering: 'auto',
              overflow: 'hidden',
              touchAction: 'manipulation',
              userSelect: 'none',
            }}
            onClick={() => handleCardClick(card.id)}
          >
            {card.isFlipped || card.isMatched ? (
              <span style={{ filter: 'drop-shadow(0 2px 2px #aaa)' }}>
                {card.emoji}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="text-center mb-4">
        <button
          onClick={initializeGame}
          className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
        >
          New Game 🔄
        </button>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🧩</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Click or tap a card to flip it</li>
          <li>• Flip two cards at a time to find a matching pair</li>
          <li>• Matched pairs stay revealed</li>
          <li>• Try to match all pairs in the fewest moves!</li>
        </ul>
      </div>
    </div>
  );
};

export default MemoryMatch;
