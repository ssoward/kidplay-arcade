import React, { useState } from 'react';

const CHOICES = ['rock', 'paper', 'scissors'];

function getRandomChoice() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

function getResult(player: string, ai: string) {
  if (player === ai) return 'tie';
  if (
    (player === 'rock' && ai === 'scissors') ||
    (player === 'paper' && ai === 'rock') ||
    (player === 'scissors' && ai === 'paper')
  ) return 'win';
  return 'lose';
}

const RockPaperScissors: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });

  const play = (choice: string) => {
    const ai = getRandomChoice();
    setPlayerChoice(choice);
    setAiChoice(ai);
    const res = getResult(choice, ai);
    setResult(res);
    if (res === 'win') setScore(s => ({ ...s, player: s.player + 1 }));
    else if (res === 'lose') setScore(s => ({ ...s, ai: s.ai + 1 }));
  };

  const reset = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setScore({ player: 0, ai: 0 });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-yellow-100 to-pink-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Rock Paper Scissors ✊✋✌️</h1>
        <p className="text-lg opacity-90">Can you beat the computer?</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="mb-4 flex gap-4">
          {CHOICES.map(choice => (
            <button
              key={choice}
              className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 transform hover:scale-105 ${playerChoice === choice ? 'ring-4 ring-purple-300' : ''}`}
              onClick={() => play(choice)}
              disabled={!!result}
            >
              {choice === 'rock' ? '✊' : choice === 'paper' ? '✋' : '✌️'} {choice.charAt(0).toUpperCase() + choice.slice(1)}
            </button>
          ))}
        </div>
        {result && (
          <div className="text-xl font-bold mb-2">
            You chose: <span className="font-mono">{playerChoice}</span> | AI chose: <span className="font-mono">{aiChoice}</span>
          </div>
        )}
        {result && (
          <div className={`text-2xl font-bold mb-2 ${result === 'win' ? 'text-green-600' : result === 'lose' ? 'text-red-600' : 'text-gray-700'}`}>
            {result === 'win' ? 'You win!' : result === 'lose' ? 'You lose!' : 'It\'s a tie!'}
          </div>
        )}
        <div className="mb-2 text-lg font-semibold">Score: You {score.player} - {score.ai} AI</div>
        <button
          onClick={reset}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105"
        >Reset</button>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play ✊✋✌️</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Choose rock, paper, or scissors</li>
          <li>• Try to beat the computer!</li>
        </ul>
      </div>
    </div>
  );
};

export default RockPaperScissors;
