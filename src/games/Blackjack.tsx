import React, { useState } from 'react';

type Card = { suit: string; value: string };
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function getDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function getCardValue(card: Card): number {
  if (card.value === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.value)) return 10;
  return parseInt(card.value);
}

function calculateScore(hand: Card[]): number {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    score += getCardValue(card);
    if (card.value === 'A') aces++;
  }
  while (score > 21 && aces) {
    score -= 10;
    aces--;
  }
  return score;
}

interface BlackjackProps {
  onExit: () => void;
}

const Blackjack: React.FC<BlackjackProps> = ({ onExit }) => {
  const [deck, setDeck] = React.useState<Card[]>(getDeck().sort(() => Math.random() - 0.5));
  const [player, setPlayer] = React.useState<Card[]>([]);
  const [dealer, setDealer] = React.useState<Card[]>([]);
  const [status, setStatus] = React.useState<'playing' | 'player-bust' | 'dealer-bust' | 'player-win' | 'dealer-win' | 'push'>('playing');
  const [showDealer, setShowDealer] = React.useState(false);

  React.useEffect(() => {
    startGame();
  }, []);

  function startGame() {
    const newDeck = getDeck().sort(() => Math.random() - 0.5);
    setDeck(newDeck);
    setPlayer([newDeck[0], newDeck[2]]);
    setDealer([newDeck[1], newDeck[3]]);
    setStatus('playing');
    setShowDealer(false);
  }

  function hit() {
    if (status !== 'playing') return;
    const newDeck = [...deck];
    const newPlayer = [...player, newDeck.shift() as Card];
    setDeck(newDeck);
    setPlayer(newPlayer);
    if (calculateScore(newPlayer) > 21) setStatus('player-bust');
  }

  function stand() {
    setShowDealer(true);
    let newDealer = [...dealer];
    let newDeck = [...deck];
    while (calculateScore(newDealer) < 17) {
      newDealer.push(newDeck.shift() as Card);
    }
    setDealer(newDealer);
    setDeck(newDeck);
    const playerScore = calculateScore(player);
    const dealerScore = calculateScore(newDealer);
    if (dealerScore > 21) setStatus('dealer-bust');
    else if (playerScore > dealerScore) setStatus('player-win');
    else if (playerScore < dealerScore) setStatus('dealer-win');
    else setStatus('push');
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-blue-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
          Blackjack 🃏
        </h1>
        <p className="text-xl text-gray-600">Try to beat the dealer! Get as close to 21 as you can without going over.</p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 border border-white/20">
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-8 py-4 shadow-lg text-xl font-bold mb-6 text-center">
          <span className="text-green-700">Your Score: {calculateScore(player)}</span>
          <span className="mx-6 text-gray-400">|</span>
          <span className="text-blue-700">Dealer: {showDealer ? calculateScore(dealer) : '?'}</span>
        </div>
        
        <div className="flex gap-8 mb-6 justify-center">
          <div className="flex flex-col items-center">
            <div className="font-bold text-lg mb-3 text-gray-800">Your Hand</div>
            <div className="flex gap-3">
              {player.map((card, i) => (
                <div key={i} className={`w-14 h-20 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center text-lg font-bold border-2 transition-all duration-200 transform hover:scale-105 ${
                  card.suit === '♥' || card.suit === '♦' ? 'text-red-500 border-red-200' : 'text-gray-800 border-gray-300'
                }`}>
                  <span className="text-sm">{card.value}</span>
                  <span className="text-2xl">{card.suit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="font-bold text-lg mb-3 text-gray-800">Dealer's Hand</div>
            <div className="flex gap-3">
              {dealer.map((card, i) => (
                <div key={i} className={`w-14 h-20 rounded-xl shadow-lg flex flex-col items-center justify-center text-lg font-bold border-2 transition-all duration-200 ${
                  showDealer || i > 0 
                    ? `bg-white ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500 border-red-200' : 'text-gray-800 border-gray-300'}` 
                    : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500'
                }`}>
                  <span className="text-sm">{showDealer || i > 0 ? card.value : '?'}</span>
                  <span className="text-2xl">{showDealer || i > 0 ? card.suit : '🂠'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          {status === 'playing' && (
            <>
              <button 
                className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
                onClick={hit}
              >
                <span className="flex items-center gap-2">
                  🎯 Hit
                </span>
              </button>
              <button 
                className="px-8 py-3 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={stand}
              >
                <span className="flex items-center gap-2">
                  ✋ Stand
                </span>
              </button>
            </>
          )}
          {status !== 'playing' && (
            <button 
              className="px-8 py-3 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300"
              onClick={startGame}
            >
              <span className="flex items-center gap-2">
                🔄 New Game
              </span>
            </button>
          )}
        </div>
        
        <div className="text-center">
          {status === 'player-bust' && (
            <div className="p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-2xl shadow-lg">
              <div className="text-4xl mb-2">💥</div>
              <div className="text-2xl font-bold text-red-700">You busted!</div>
            </div>
          )}
          {status === 'dealer-bust' && (
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl shadow-lg">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-green-700">Dealer busted! You win!</div>
            </div>
          )}
          {status === 'player-win' && (
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl shadow-lg">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-green-700">You win!</div>
            </div>
          )}
          {status === 'dealer-win' && (
            <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl shadow-lg">
              <div className="text-4xl mb-2">😢</div>
              <div className="text-2xl font-bold text-blue-700">Dealer wins!</div>
            </div>
          )}
          {status === 'push' && (
            <div className="p-4 bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-300 rounded-2xl shadow-lg">
              <div className="text-4xl mb-2">🤝</div>
              <div className="text-2xl font-bold text-gray-700">It's a tie!</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 max-w-md shadow-lg border border-white/30">
        <h3 className="font-bold text-xl mb-4 text-gray-800 text-center flex items-center justify-center gap-2">
          <span>🎯</span> How to Play
        </h3>
        <ul className="text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">1.</span>
            <span>Try to get as close to 21 as possible without going over</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">2.</span>
            <span>Face cards (J, Q, K) are worth 10 points</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">3.</span>
            <span>Aces are worth 1 or 11 (whichever is better)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">4.</span>
            <span>Dealer must draw cards until reaching 17 or higher</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Blackjack;
