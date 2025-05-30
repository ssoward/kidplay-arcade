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

function getChoiceEmoji(choice: string) {
  switch (choice) {
    case 'rock': return '✊';
    case 'paper': return '✋';
    case 'scissors': return '✌️';
    default: return '❓';
  }
}

const RockPaperScissors: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const play = (choice: string) => {
    if (isPlaying) return; // Prevent multiple clicks during animation
    
    setIsPlaying(true);
    const ai = getRandomChoice();
    setPlayerChoice(choice);
    setAiChoice(ai);
    const res = getResult(choice, ai);
    setResult(res);
    if (res === 'win') setScore(s => ({ ...s, player: s.player + 1 }));
    else if (res === 'lose') setScore(s => ({ ...s, ai: s.ai + 1 }));
    
    // Auto-clear result after 2 seconds to allow continuous play
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
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
        {result && (
          <div className="flex items-center justify-center gap-8 mb-6 animate-fade-in">
            <div className="text-center">
              <div className="text-6xl mb-2">{getChoiceEmoji(playerChoice!)}</div>
              <div className="text-lg font-semibold text-blue-600">You</div>
            </div>
            <div className="text-3xl font-bold text-gray-500">VS</div>
            <div className="text-center">
              <div className="text-6xl mb-2">{getChoiceEmoji(aiChoice!)}</div>
              <div className="text-lg font-semibold text-red-600">AI</div>
            </div>
          </div>
        )}
        <div className="mb-4 flex gap-4">
          {CHOICES.map(choice => (
            <button
              key={choice}
              className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transform hover:scale-105 ${
                playerChoice === choice ? 'ring-4 ring-purple-300' : ''
              } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => play(choice)}
              disabled={isPlaying}
            >
              {getChoiceEmoji(choice)} {choice.charAt(0).toUpperCase() + choice.slice(1)}
            </button>
          ))}
        </div>
        {result && (
          <div className={`text-2xl font-bold mb-2 animate-bounce ${result === 'win' ? 'text-green-600' : result === 'lose' ? 'text-red-600' : 'text-gray-700'}`}>
            {result === 'win' ? '🎉 You win!' : result === 'lose' ? '😞 You lose!' : '🤝 It\'s a tie!'}
          </div>
        )}
        <div className="mb-2 text-lg font-semibold">Score: You {score.player} - {score.ai} AI</div>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105"
          >Reset Score</button>
          {isPlaying && (
            <div className="flex items-center text-blue-600 font-semibold">
              <span className="animate-pulse">⏳ Next round in 2 seconds...</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play ✊✋✌️</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Choose rock, paper, or scissors</li>
          <li>• Try to beat the computer!</li>
          <li>• Game continues automatically - no need to reset!</li>
          <li>• Use "Reset Score" to start over</li>
        </ul>
      </div>
    </div>
  );
};

export default RockPaperScissors;
