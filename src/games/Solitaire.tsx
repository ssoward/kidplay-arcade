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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
          Solitaire ♠️♥️♦️♣️
        </h1>
        <p className="text-xl text-gray-600">A relaxing game of classic Klondike Solitaire</p>
      </div>
      
      {/* Top Row: Stock, Waste, Foundations */}
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-6 px-4 gap-4">
        {/* Stock pile */}
        <div 
          className={`w-16 h-22 rounded-xl border-2 shadow-lg flex items-center justify-center font-bold text-2xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
            stock.length 
              ? 'bg-slate-600 border-slate-700 text-white hover:bg-slate-700' 
              : 'bg-gray-200 border-gray-300 text-gray-400 opacity-50'
          }`}
          onClick={handleStockClick} 
          aria-label="Stock pile" 
          tabIndex={0}
        >
          <span>{stock.length ? '🂠' : '↺'}</span>
        </div>
        
        {/* Waste pile */}
        <div className="w-16 h-22 rounded-xl border-2 border-slate-400 bg-gray-100 shadow-lg flex items-center justify-start relative overflow-visible">
          {waste.length === 0 ? (
            <span className="opacity-30 text-2xl ml-2">🂠</span>
          ) : (
            waste.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <div
                  key={card.id}
                  className={`absolute w-12 h-18 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-sm transition-all duration-200 ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-800'
                  } ${
                    isTop 
                      ? 'bg-white border-slate-600 shadow-md cursor-grab hover:shadow-lg z-10' 
                      : 'bg-white border-slate-300 shadow-sm opacity-70'
                  }`}
                  style={{ left: `${i * 18}px`, zIndex: i }}
                  draggable={isTop}
                  onDragStart={isTop ? (e) => onWasteDragStart(e) : undefined}
                  aria-label={isTop ? `Waste: ${card.rank}${card.suit}` : undefined}
                  tabIndex={isTop ? 0 : -1}
                >
                  <span className="text-xs">{card.rank}</span>
                  <span className="text-lg leading-none">{card.suit}</span>
                </div>
              );
            })
          )}
        </div>
        
        {/* Foundations */}
        <div className="flex gap-4 flex-1 justify-end">
          {foundations.map((pile, fIdx) => (
            <div
              key={fIdx}
              className="w-16 h-22 rounded-xl border-2 border-slate-400 bg-white shadow-lg flex flex-col items-center justify-center font-bold text-lg transition-all duration-200 hover:shadow-xl"
              onDragOver={e => onFoundationDragOver(fIdx, e)}
              onDrop={e => onFoundationDrop(fIdx, e)}
            >
              {pile.length === 0 ? (
                <span className="opacity-30 text-slate-500">{foundationSuits[fIdx]}</span>
              ) : (
                <>
                  <span className="text-xs">{pile[pile.length-1].rank}</span>
                  <span className={`text-xl leading-none ${
                    pile[pile.length-1].suit === '♥' || pile[pile.length-1].suit === '♦' ? 'text-red-500' : 'text-gray-800'
                  }`}>
                    {pile[pile.length-1].suit}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Tableau */}
      <div className="flex flex-row items-start justify-center gap-2 max-w-6xl w-full min-h-96 bg-gradient-to-br from-green-100 to-emerald-200 border-4 border-green-600 rounded-2xl shadow-xl mx-auto p-4 mb-6">
        {tableau && tableau.map((col, colIdx) => (
          <div
            key={colIdx}
            className="min-h-80 w-full flex flex-col items-center justify-start relative"
            onDragOver={e => onDragOver(colIdx, e)}
            onDrop={e => onDrop(colIdx, e)}
          >
            {/* Drop zone at the top */}
            <div
              className="h-16 min-w-12 bg-transparent w-full"
              onDragOver={e => onDragOver(colIdx, e)}
              onDrop={e => onDrop(colIdx, e)}
            />
            {col.map((card, cardIdx) => (
              <div
                key={card.id || `${colIdx}-${cardIdx}`}
                className={`w-full max-w-16 min-w-9 aspect-[3/4] relative rounded-xl shadow-lg border-2 font-bold flex items-center justify-center select-none transition-all duration-200 overflow-hidden ${
                  card.faceUp 
                    ? `bg-white border-slate-600 cursor-grab hover:shadow-xl ${
                        card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-800'
                      }` 
                    : 'bg-slate-600 border-slate-700 cursor-default'
                } ${
                  dragged && dragged.col === colIdx && dragged.cardIdx === cardIdx ? 'opacity-50' : 'opacity-100'
                }`}
                style={{
                  marginTop: cardIdx === 0 ? 0 : '-2.2vw',
                  zIndex: cardIdx,
                  fontSize: 'min(5vw, 1.5rem)',
                }}
                draggable={card.faceUp && cardIdx === col.length - 1}
                onDragStart={e => onDragStart(colIdx, cardIdx, e)}
                onDragEnd={onDragEnd}
                tabIndex={card.faceUp ? 0 : -1}
                aria-label={card.faceUp ? `${card.rank}${card.suit}` : 'Face down card'}
              >
                {card.faceUp ? (
                  <div className="flex flex-col items-center w-full">
                    <span className="text-lg font-bold">{card.rank}</span>
                    <span className="text-2xl leading-none">{card.suit}</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-blue-800 rounded-lg flex items-center justify-center">
                    <span className="text-blue-300 text-xl">🂠</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
          onClick={restartGame}
        >
          <span className="flex items-center gap-2">
            🔄 New Game
          </span>
        </button>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 max-w-md shadow-lg border border-white/30">
        <h3 className="font-bold text-xl mb-4 text-gray-800 text-center flex items-center justify-center gap-2">
          <span>🎯</span> How to Play
        </h3>
        <ul className="text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">1.</span>
            <span>Build foundation piles by suit from Ace to King</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">2.</span>
            <span>Stack cards in tableau in descending order, alternating colors</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">3.</span>
            <span>Click stock pile to deal 3 cards to waste pile</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 font-bold">4.</span>
            <span>Drag cards between tableau columns and to foundations</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Solitaire;
