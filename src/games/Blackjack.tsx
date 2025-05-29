import React, { useState } from 'react';
import './Chess.css';

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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-yellow-100 to-blue-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Blackjack 🃏</h1>
        <p className="text-lg opacity-90">Try to beat the dealer! Get as close to 21 as you can without going over.</p>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <div className="bg-white/80 rounded-full px-6 py-3 shadow text-lg font-semibold mb-2">
          <span className="text-green-700">Your Score: {calculateScore(player)}</span>
          <span className="mx-4">|</span>
          <span className="text-blue-700">Dealer: {showDealer ? calculateScore(dealer) : '?'}</span>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col items-center">
            <div className="font-bold mb-1">You</div>
            <div className="flex gap-2">
              {player.map((card, i) => (
                <div key={i} className="w-10 h-14 bg-white rounded-lg shadow flex flex-col items-center justify-center text-xl font-bold border border-gray-300">
                  <span>{card.value}</span>
                  <span>{card.suit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-bold mb-1">Dealer</div>
            <div className="flex gap-2">
              {dealer.map((card, i) => (
                <div key={i} className="w-10 h-14 bg-white rounded-lg shadow flex flex-col items-center justify-center text-xl font-bold border border-gray-300">
                  <span>{showDealer || i > 0 ? card.value : '?'}</span>
                  <span>{showDealer || i > 0 ? card.suit : '?'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mb-4">
          {status === 'playing' && (
            <>
              <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={hit}>Hit</button>
              <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={stand}>Stand</button>
            </>
          )}
          {status !== 'playing' && (
            <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={startGame}>New Game</button>
          )}
        </div>
        <div className="text-xl font-bold mb-2">
          {status === 'player-bust' && <span className="text-red-600">You busted! 💥</span>}
          {status === 'dealer-bust' && <span className="text-green-600">Dealer busted! You win! 🎉</span>}
          {status === 'player-win' && <span className="text-green-600">You win! 🎉</span>}
          {status === 'dealer-win' && <span className="text-blue-600">Dealer wins! 😢</span>}
          {status === 'push' && <span className="text-gray-600">It's a tie! 🤝</span>}
        </div>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🃏</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Try to get as close to 21 as possible without going over</li>
          <li>• Face cards are worth 10, Aces are 1 or 11</li>
          <li>• Click Hit to draw a card, Stand to end your turn</li>
          <li>• Dealer must draw until 17 or higher</li>
        </ul>
      </div>
    </div>
  );
};

export default Blackjack;
