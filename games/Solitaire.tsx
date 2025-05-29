// Solitaire high-quality enhancement
// This is a placeholder for a modern Solitaire UI. For a real implementation, a full solitaire engine would be needed.
// --- Solitaire game state and logic ---
import React, { useState, useCallback, useRef } from 'react';

// Card and game types
const suits = ['♠', '♥', '♦', '♣'] as const;
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

type Suit = typeof suits[number];
type Rank = typeof ranks[number];

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

type Tableau = Card[][];

function createDeck(): Card[] {
  let id = 0;
  return suits.flatMap(suit =>
    ranks.map(rank => ({
      id: `${suit}${rank}-${id++}`,
      suit,
      rank,
      faceUp: false,
    }))
  );
}

function shuffle<T>(arr: T[]): T[] {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function dealTableau(deck: Card[]): Tableau {
  const tableau: Tableau = Array.from({ length: 7 }, () => []);
  let deckIdx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIdx++], faceUp: row === col };
      tableau[col].push(card);
    }
  }
  return tableau;
}

const Solitaire: React.FC = () => {
  // --- State ---
  const [tableau, setTableau] = useState<Tableau>(() => {
    const deck = shuffle(createDeck());
    return dealTableau(deck);
  });
  // --- Foundation, stock, and waste piles for Solitaire UI ---
  const [foundations, setFoundations] = useState<Array<Card[]>>([
    [], [], [], []
  ]);
  const foundationSuits: Suit[] = ['♠', '♥', '♦', '♣'];

  const [stock, setStock] = useState<Card[]>(() => {
    const deck = shuffle(createDeck());
    // Remove tableau cards from deck
    const tableauCards = dealTableau(deck).flat().map(c => c.id);
    return deck.filter(card => !tableauCards.includes(card.id));
  });
  const [waste, setWaste] = useState<Card[]>([]);

  // --- Reset all state on restart ---
  const restartGame = useCallback(() => {
    const deck = shuffle(createDeck());
    const tableau = dealTableau(deck);
    const tableauCards = tableau.flat().map(c => c.id);
    setTableau(tableau);
    setFoundations([[], [], [], []]);
    setWaste([]);
    setStock(deck.filter(card => !tableauCards.includes(card.id)));
  }, []);

  // --- Card click handler (flip top card face up if not already) ---
  const handleCardClick = useCallback((colIdx: number, cardIdx: number) => {
    setTableau(prev => {
      const newTab = prev.map(col => [...col]);
      const col = newTab[colIdx];
      if (!col[cardIdx].faceUp && cardIdx === col.length - 1) {
        col[cardIdx].faceUp = true;
      }
      // (Move logic omitted for brevity)
      return newTab;
    });
  }, []);

  // --- Stock click handler: deal 3 cards to waste ---
  const handleStockClick = () => {
    if (stock.length === 0) {
      // If stock is empty, recycle waste (reverse order, all faceDown)
      setStock(waste.map(card => ({ ...card, faceUp: false })).reverse());
      setWaste([]);
      return;
    }
    // Deal up to 3 cards
    const dealCount = Math.min(3, stock.length);
    const newWaste = [...waste, ...stock.slice(0, dealCount).map(card => ({ ...card, faceUp: true }))];
    setWaste(newWaste);
    setStock(stock.slice(dealCount));
  };

  // --- Foundation drag handlers ---
  const onFoundationDragOver = (fIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onFoundationDrop = (fIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    let fromCol: number, fromIdx: number;
    if (data.startsWith('waste')) {
      fromCol = -1;
      fromIdx = waste.length - 1;
    } else {
      [fromCol, fromIdx] = data.split(',').map(Number);
    }
    setTableau(prev => {
      const newTab = prev.map(col => Array.isArray(col) ? [...col] : []);
      let moving;
      if (fromCol === -1) {
        moving = [waste[waste.length - 1]];
      } else {
        moving = newTab[fromCol].slice(fromIdx);
      }
      if (moving.length !== 1) return prev;
      const card = moving[0];
      if (card.suit !== foundationSuits[fIdx]) return prev;
      const foundation = foundations[fIdx];
      const rankOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
      if (foundation.length === 0 && card.rank !== 'A') return prev;
      if (foundation.length > 0) {
        const top = foundation[foundation.length - 1];
        if (rankOrder.indexOf(card.rank) !== rankOrder.indexOf(top.rank) + 1) return prev;
      }
      if (fromCol !== -1) {
        newTab[fromCol] = newTab[fromCol].slice(0, fromIdx);
        for (let i = 0; i < newTab.length; i++) {
          if (!Array.isArray(newTab[i]) || newTab[i].length === 0) newTab[i] = [];
        }
        if (newTab[fromCol].length && !newTab[fromCol][newTab[fromCol].length-1].faceUp) {
          newTab[fromCol][newTab[fromCol].length-1].faceUp = true;
        }
      }
      setFoundations(f => {
        const newF = f.map(arr => [...arr]);
        newF[fIdx].push(card);
        return newF;
      });
      return [...newTab];
    });
    if (fromCol === -1) {
      setWaste(w => w.slice(0, -1));
    }
    setDragged(null);
  };

  // --- Card drag state ---
  const [dragged, setDragged] = useState<{col: number, cardIdx: number} | null>(null);
  const dragCardRef = useRef<HTMLDivElement | null>(null);

  // --- Drag handlers ---
  const onDragStart = (colIdx: number, cardIdx: number, e: React.DragEvent) => {
    setDragged({ col: colIdx, cardIdx });
    dragCardRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${colIdx},${cardIdx}`);
  };
  const onDragEnd = () => {
    setDragged(null);
    dragCardRef.current = null;
  };
  const onDragOver = (colIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (colIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    let fromCol: number, fromIdx: number;
    if (data.startsWith('waste')) {
      fromCol = -1;
      fromIdx = waste.length - 1;
    } else {
      [fromCol, fromIdx] = data.split(',').map(Number);
    }
    if (fromCol === colIdx) return;
    let movedFromWaste = false;
    setTableau(prev => {
      const newTab = prev.map(col => [...col]);
      let moving;
      if (fromCol === -1) {
        moving = [waste[waste.length - 1]];
        movedFromWaste = true;
      } else {
        moving = newTab[fromCol].slice(fromIdx);
      }
      if (!moving[0]?.faceUp) return prev;
      const dest = newTab[colIdx];
      if (dest.length === 0) {
        if (moving[0].rank !== 'K') return prev;
      } else {
        const destCard = dest[dest.length - 1];
        const color = (s: Suit) => s === '♥' || s === '♦' ? 'red' : 'black';
        const rankOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        if (color(destCard.suit) === color(moving[0].suit)) return prev;
        if (rankOrder.indexOf(destCard.rank) !== rankOrder.indexOf(moving[0].rank) + 1) return prev;
      }
      if (fromCol !== -1) {
        newTab[fromCol] = newTab[fromCol].slice(0, fromIdx);
        if (newTab[fromCol].length && !newTab[fromCol][newTab[fromCol].length-1].faceUp) {
          newTab[fromCol][newTab[fromCol].length-1].faceUp = true;
        }
      }
      newTab[colIdx] = [...newTab[colIdx], ...moving];
      return newTab;
    });
    if (fromCol === -1) {
      setWaste(w => w.slice(0, -1));
    }
    setDragged(null);
  };

  // --- Card move logic: allow moving face-up cards to another column if valid ---
  const canDrop = (fromCol: number, fromIdx: number, toCol: number) => {
    if (fromCol === toCol) return false;
    const movingCard = tableau[fromCol][fromIdx];
    const destCol = tableau[toCol];
    if (destCol.length === 0) return movingCard.rank === 'K';
    const destCard = destCol[destCol.length - 1];
    // Alternating color and descending rank
    const isRed = (s: Suit) => s === '♥' || s === '♦';
    const isBlack = (s: Suit) => s === '♠' || s === '♣';
    const rankOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const movingIdx = rankOrder.indexOf(movingCard.rank);
    const destIdx = rankOrder.indexOf(destCard.rank);
    return (
      ((isRed(movingCard.suit) && isBlack(destCard.suit)) || (isBlack(movingCard.suit) && isRed(destCard.suit))) &&
      movingIdx === destIdx - 1
    );
  };

  const handleDragStart = (colIdx: number, cardIdx: number) => {
    if (!tableau[colIdx][cardIdx].faceUp) return;
    setDragged({ col: colIdx, cardIdx });
  };

  const handleDrop = (toCol: number) => {
    if (!dragged) return;
    const { col: fromCol, cardIdx: fromIdx } = dragged;
    if (!canDrop(fromCol, fromIdx, toCol)) return;
    setTableau(prev => {
      const newTab = prev.map(col => [...col]);
      const moving = newTab[fromCol].slice(fromIdx);
      newTab[fromCol] = newTab[fromCol].slice(0, fromIdx);
      newTab[toCol] = [...newTab[toCol], ...moving];
      return newTab;
    });
    setDragged(null);
  };

  const handleDragEnd = () => setDragged(null);

  // Waste drag handlers (allow moving top waste card)
  const onWasteDragStart = (e: React.DragEvent) => {
    if (waste.length === 0) return;
    setDragged({ col: -1, cardIdx: waste.length - 1 }); // -1 means waste
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `waste,${waste.length - 1}`);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-yellow-100 to-blue-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Solitaire ♠️♥️♦️♣️</h1>
        <p className="text-lg opacity-90">A relaxing game of classic Solitaire.</p>
      </div>
      {/* --- Top Row: Stock, Waste, Foundations --- */}
      <div className="solitaire-top-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto 2vw auto',
        padding: '0 2vw',
        minHeight: '70px',
        gap: '2vw',
      }}>
        {/* Stock pile */}
        <div className="solitaire-stock" style={{
          width: '64px', height: '88px', borderRadius: '10px', border: '2px solid #64748b', background: stock.length ? '#64748b' : '#e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.5rem', userSelect: 'none', position: 'relative', marginRight: '2vw', cursor: 'pointer', opacity: stock.length ? 1 : 0.5
        }} onClick={handleStockClick} aria-label="Stock pile" tabIndex={0}>
          <span>{stock.length ? '🂠' : '↺'}</span>
        </div>
        {/* Waste pile */}
        <div className="solitaire-waste" style={{
          width: '64px', height: '88px', borderRadius: '10px', border: '2px solid #64748b', background: waste.length ? '#fff' : '#e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: '#64748b', fontWeight: 'bold', fontSize: '1.5rem', userSelect: 'none', position: 'relative', marginRight: '4vw', cursor: waste.length ? 'grab' : 'default', opacity: waste.length ? 1 : 0.5, overflow: 'visible'
        }}>
          {waste.length === 0 ? (
            <span style={{ opacity: 0.3 }}>🂠</span>
          ) : (
            waste.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <span
                  key={card.id}
                  style={{
                    position: 'absolute',
                    left: `${i * 18}px`,
                    zIndex: i,
                    fontWeight: 700,
                    color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#222',
                    background: '#fff',
                    borderRadius: '8px',
                    border: isTop ? '2px solid #334155' : '1px solid #cbd5e1',
                    boxShadow: isTop ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                    width: '48px',
                    height: '72px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2em',
                    cursor: isTop ? 'grab' : 'default',
                    pointerEvents: isTop ? 'auto' : 'none',
                    opacity: isTop ? 1 : 0.7,
                    transition: 'box-shadow 0.2s, background 0.2s',
                  }}
                  draggable={isTop}
                  onDragStart={isTop ? (e) => onWasteDragStart(e) : undefined}
                  aria-label={isTop ? `Waste: ${card.rank}${card.suit}` : undefined}
                  tabIndex={isTop ? 0 : -1}
                >
                  {card.rank}{card.suit}
                </span>
              );
            })
          )}
        </div>
        {/* Foundations */}
        <div className="solitaire-foundations" style={{ display: 'flex', gap: '2vw', flex: 1, justifyContent: 'flex-end' }}>
          {foundations.map((pile, fIdx) => (
            <div
              key={fIdx}
              className="solitaire-foundation"
              style={{
                width: '64px', height: '88px', borderRadius: '10px', border: '2px solid #64748b', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold', fontSize: '1.5rem', userSelect: 'none', position: 'relative', marginLeft: fIdx === 0 ? 0 : '2vw'
              }}
              onDragOver={e => onFoundationDragOver(fIdx, e)}
              onDrop={e => onFoundationDrop(fIdx, e)}
            >
              {pile.length === 0 ? (
                <span style={{ opacity: 0.3 }}>{foundationSuits[fIdx]}</span>
              ) : (
                <span style={{ fontWeight: 700, color: pile[pile.length-1].suit === '♥' || pile[pile.length-1].suit === '♦' ? '#ef4444' : '#222' }}>
                  {pile[pile.length-1].rank}{pile[pile.length-1].suit}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Remove the placeholder and always show the game board */}
      {/* --- Tableau --- */}
      <div className="solitaire-board" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '2vw',
        maxWidth: '98vw',
        width: '100%',
        minHeight: '60vw',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)',
        border: '4px solid #334155',
        borderRadius: '18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        margin: '0 auto',
        padding: '2vw',
        boxSizing: 'border-box',
      }}>
        {tableau && tableau.map((col, colIdx) => (
          <div
            key={colIdx}
            className="solitaire-column"
            style={{ minHeight: '40vw', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}
            onDragOver={e => onDragOver(colIdx, e)}
            onDrop={e => onDrop(colIdx, e)}
          >
            {/* Make the entire column (including the top) a drop target by adding a drop zone at the top */}
            <div
              style={{ height: '64px', minWidth: '36px', background: 'transparent', width: '100%' }}
              onDragOver={e => onDragOver(colIdx, e)}
              onDrop={e => onDrop(colIdx, e)}
            />
            {col.map((card, cardIdx) => (
              <div
                key={card.id || `${colIdx}-${cardIdx}`}
                className={`solitaire-card${card.faceUp ? ' faceup' : ' facedown'}`}
                style={{
                  width: '100%',
                  maxWidth: '64px',
                  minWidth: '36px',
                  aspectRatio: '3/4',
                  marginTop: cardIdx === 0 ? 0 : '-2.2vw',
                  zIndex: cardIdx,
                  position: 'relative',
                  borderRadius: '10px',
                  boxShadow: card.faceUp ? '0 2px 12px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.08)',
                  background: card.faceUp ? '#fff' : '#64748b',
                  border: card.faceUp ? '2px solid #334155' : '2px solid #64748b',
                  color: card.suit === '♥' || card.suit === '♦' ? '#ef4444' : '#222',
                  fontWeight: 'bold',
                  fontSize: 'min(5vw, 1.5rem)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  transition: 'box-shadow 0.2s, background 0.2s',
                  cursor: card.faceUp ? 'grab' : 'default',
                  overflow: 'hidden',
                  opacity: dragged && dragged.col === colIdx && dragged.cardIdx === cardIdx ? 0.5 : 1,
                }}
                draggable={card.faceUp && cardIdx === col.length - 1}
                onDragStart={e => onDragStart(colIdx, cardIdx, e)}
                onDragEnd={onDragEnd}
                tabIndex={card.faceUp ? 0 : -1}
                aria-label={card.faceUp ? `${card.rank}${card.suit}` : 'Face down card'}
              >
                {card.faceUp ? (
                  <span style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                  }}>
                    <span style={{ fontSize: '1.1em', fontWeight: 700 }}>{card.rank}</span>
                    <span style={{ fontSize: '1.5em', lineHeight: 1 }}>{card.suit}</span>
                  </span>
                ) : (
                  <span style={{ width: '100%', height: '100%' }} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="solitaire-controls" style={{
        marginTop: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
      }}>
        <button
          className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
          style={{
            padding: '12px 28px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid #64748b',
            background: '#fff',
            color: '#2563eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'manipulation',
          }}
          onClick={restartGame}
        >
          Restart
        </button>
        {/* Add more controls as needed */}
      </div>
    </div>
  );
};

export default Solitaire;
