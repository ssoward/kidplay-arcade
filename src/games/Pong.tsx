import React, { useState, useEffect, useCallback } from 'react';

interface PongProps {
  onExit?: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

const Pong: React.FC<PongProps> = ({ onExit }) => {
  const [gameRunning, setGameRunning] = useState(false);
  const [ballPosition, setBallPosition] = useState<Position>({ x: 400, y: 200 });
  const [ballVelocity, setBallVelocity] = useState<Velocity>({ x: 3, y: 2 });
  const [playerPaddle, setPlayerPaddle] = useState(175);
  const [aiPaddle, setAiPaddle] = useState(175);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const gameWidth = 800;
  const gameHeight = 400;
  const paddleHeight = 80;
  const paddleWidth = 10;
  const ballSize = 10;

  const difficultySettings = {
    easy: { aiSpeed: 2, ballSpeedMultiplier: 0.8 },
    medium: { aiSpeed: 3, ballSpeedMultiplier: 1 },
    hard: { aiSpeed: 4, ballSpeedMultiplier: 1.2 }
  };

  const resetBall = useCallback(() => {
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    const angle = (Math.random() - 0.5) * Math.PI / 3; // Random angle between -30 and 30 degrees
    const speed = 3 * difficultySettings[difficulty].ballSpeedMultiplier;
    setBallVelocity({
      x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      y: Math.sin(angle) * speed
    });
  }, [difficulty]);

  const startGame = () => {
    setGameRunning(true);
    setPlayerScore(0);
    setAiScore(0);
    resetBall();
  };

  const pauseGame = () => {
    setGameRunning(!gameRunning);
  };

  const resetGame = () => {
    setGameRunning(false);
    setPlayerScore(0);
    setAiScore(0);
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    setBallVelocity({ x: 0, y: 0 });
    setPlayerPaddle(175);
    setAiPaddle(175);
  };

  // Handle mouse movement for player paddle
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameRunning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const paddleY = Math.max(0, Math.min(gameHeight - paddleHeight, mouseY - paddleHeight / 2));
    setPlayerPaddle(paddleY);
  }, [gameRunning]);

  // Game loop
  useEffect(() => {
    if (!gameRunning) return;

    const gameLoop = setInterval(() => {
      setBallPosition(prevPos => {
        const newX = prevPos.x + ballVelocity.x;
        const newY = prevPos.y + ballVelocity.y;

        // Ball collision with top and bottom walls
        if (newY <= 0 || newY >= gameHeight - ballSize) {
          setBallVelocity(prev => ({ ...prev, y: -prev.y }));
          return { x: newX, y: Math.max(0, Math.min(gameHeight - ballSize, newY)) };
        }

        // Ball collision with player paddle (right side)
        if (newX >= gameWidth - paddleWidth - ballSize &&
            newX <= gameWidth - paddleWidth &&
            newY >= playerPaddle &&
            newY <= playerPaddle + paddleHeight) {
          
          // Calculate hit position for angle variation
          const hitPos = (newY - playerPaddle) / paddleHeight - 0.5; // -0.5 to 0.5
          const angle = hitPos * Math.PI / 3; // Max 60 degree angle
          const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
          
          setBallVelocity({
            x: -Math.abs(Math.cos(angle) * speed),
            y: Math.sin(angle) * speed
          });
          
          return { x: gameWidth - paddleWidth - ballSize, y: newY };
        }

        // Ball collision with AI paddle (left side)
        if (newX <= paddleWidth &&
            newX >= 0 &&
            newY >= aiPaddle &&
            newY <= aiPaddle + paddleHeight) {
          
          const hitPos = (newY - aiPaddle) / paddleHeight - 0.5;
          const angle = hitPos * Math.PI / 3;
          const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
          
          setBallVelocity({
            x: Math.abs(Math.cos(angle) * speed),
            y: Math.sin(angle) * speed
          });
          
          return { x: paddleWidth, y: newY };
        }

        // Ball goes off screen (scoring)
        if (newX < 0) {
          setPlayerScore(prev => prev + 1);
          setTimeout(resetBall, 1000);
          return { x: gameWidth / 2, y: gameHeight / 2 };
        }

        if (newX > gameWidth) {
          setAiScore(prev => prev + 1);
          setTimeout(resetBall, 1000);
          return { x: gameWidth / 2, y: gameHeight / 2 };
        }

        return { x: newX, y: newY };
      });

      // AI paddle movement
      setAiPaddle(prevPaddle => {
        const ballCenterY = ballPosition.y + ballSize / 2;
        const paddleCenterY = prevPaddle + paddleHeight / 2;
        const diff = ballCenterY - paddleCenterY;
        const aiSpeed = difficultySettings[difficulty].aiSpeed;
        
        if (Math.abs(diff) < aiSpeed) return prevPaddle;
        
        const newPaddle = prevPaddle + (diff > 0 ? aiSpeed : -aiSpeed);
        return Math.max(0, Math.min(gameHeight - paddleHeight, newPaddle));
      });

    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameRunning, ballVelocity, ballPosition, playerPaddle, aiPaddle, difficulty, resetBall]);

  // Check for game end
  useEffect(() => {
    if (playerScore >= 5 || aiScore >= 5) {
      setGameRunning(false);
    }
  }, [playerScore, aiScore]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            🏓 Pong Classic
          </h1>
          <p className="text-xl text-gray-700">
            The classic arcade game! First to 5 points wins!
          </p>
        </div>

        {/* Game Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onExit}
              className="bg-white/80 hover:bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
            >
              ← Back
            </button>
            
            <div className="flex space-x-4">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-medium"
                disabled={gameRunning}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {!gameRunning && (playerScore < 5 && aiScore < 5) && (
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                >
                  🚀 Start Game
                </button>
              )}

              {gameRunning && (
                <button
                  onClick={pauseGame}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                >
                  ⏸️ Pause
                </button>
              )}

              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Score Board */}
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{aiScore}</div>
              <div className="text-gray-600 font-medium">AI</div>
            </div>
            <div className="text-2xl font-bold text-gray-400">VS</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{playerScore}</div>
              <div className="text-gray-600 font-medium">You</div>
            </div>
          </div>

          {/* Game Area */}
          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto" style={{ width: gameWidth, height: gameHeight }}>
            {/* Game Canvas */}
            <div 
              className="absolute inset-0 cursor-none"
              onMouseMove={handleMouseMove}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Center Line */}
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30 transform -translate-x-1/2" />
              
              {/* Ball */}
              <div
                className="absolute bg-white rounded-full shadow-lg"
                style={{
                  width: ballSize,
                  height: ballSize,
                  left: ballPosition.x,
                  top: ballPosition.y,
                  transition: gameRunning ? 'none' : 'all 0.3s ease'
                }}
              />
              
              {/* Player Paddle (Right) */}
              <div
                className="absolute bg-white rounded-sm shadow-lg"
                style={{
                  width: paddleWidth,
                  height: paddleHeight,
                  right: 0,
                  top: playerPaddle,
                  transition: 'top 0.1s ease'
                }}
              />
              
              {/* AI Paddle (Left) */}
              <div
                className="absolute bg-white rounded-sm shadow-lg"
                style={{
                  width: paddleWidth,
                  height: paddleHeight,
                  left: 0,
                  top: aiPaddle,
                  transition: 'top 0.1s ease'
                }}
              />

              {/* Game Status Overlay */}
              {!gameRunning && (playerScore >= 5 || aiScore >= 5) && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {playerScore >= 5 ? '🎉' : '🤖'}
                    </div>
                    <div className="text-4xl font-bold text-white mb-4">
                      {playerScore >= 5 ? 'You Win!' : 'AI Wins!'}
                    </div>
                    <button
                      onClick={resetGame}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}

              {!gameRunning && playerScore < 5 && aiScore < 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-4">
                      Ready to Play?
                    </div>
                    <p className="text-white/80 mb-6">Move your mouse to control the right paddle</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🎮 How to Play
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-3">🖱️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Control</h4>
              <p>Move your mouse up and down to control the right paddle</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-800 mb-2">Objective</h4>
              <p>Hit the ball past the AI paddle to score points</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h4 className="font-semibold text-gray-800 mb-2">Win Condition</h4>
              <p>First player to reach 5 points wins the game</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <h4 className="font-semibold text-gray-800 mb-2">💡 Tips:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Hit the ball with different parts of your paddle to change its angle</p>
              <p>• The AI gets faster and smarter on higher difficulties</p>
              <p>• Try to predict where the ball will go and position your paddle early</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pong;
