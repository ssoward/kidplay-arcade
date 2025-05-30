import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isMobile, setIsMobile] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Responsive game dimensions
  const baseGameWidth = 800;
  const baseGameHeight = 400;
  const [gameWidth, setGameWidth] = useState(baseGameWidth);
  const [gameHeight, setGameHeight] = useState(baseGameHeight);
  const paddleHeight = Math.max(60, gameHeight * 0.2); // Responsive paddle height
  const paddleWidth = Math.max(8, gameWidth * 0.0125); // Responsive paddle width
  const ballSize = Math.max(8, Math.min(gameWidth, gameHeight) * 0.025); // Responsive ball size

  const difficultySettings = {
    easy: { aiSpeed: 2, ballSpeedMultiplier: 0.8 },
    medium: { aiSpeed: 3, ballSpeedMultiplier: 1 },
    hard: { aiSpeed: 4, ballSpeedMultiplier: 1.2 }
  };

  // Detect mobile and update game dimensions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        const width = Math.min(window.innerWidth - 32, 600); // 32px for padding
        const height = Math.min(width * 0.6, 360); // Maintain aspect ratio
        setGameWidth(width);
        setGameHeight(height);
      } else {
        setGameWidth(baseGameWidth);
        setGameHeight(baseGameHeight);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update ball and paddle positions when game dimensions change
  useEffect(() => {
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    setPlayerPaddle((gameHeight - paddleHeight) / 2);
    setAiPaddle((gameHeight - paddleHeight) / 2);
  }, [gameWidth, gameHeight, paddleHeight]);

  const resetBall = useCallback(() => {
    setBallPosition({ x: gameWidth / 2, y: gameHeight / 2 });
    const angle = (Math.random() - 0.5) * Math.PI / 3; // Random angle between -30 and 30 degrees
    const speed = (gameWidth / 267) * difficultySettings[difficulty].ballSpeedMultiplier; // Scale speed with game size
    setBallVelocity({
      x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      y: Math.sin(angle) * speed
    });
  }, [difficulty, gameWidth, gameHeight]);

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
    setPlayerPaddle((gameHeight - paddleHeight) / 2);
    setAiPaddle((gameHeight - paddleHeight) / 2);
  };

  // Handle mouse movement for player paddle
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameRunning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const paddleY = Math.max(0, Math.min(gameHeight - paddleHeight, mouseY - paddleHeight / 2));
    setPlayerPaddle(paddleY);
  }, [gameRunning, gameHeight, paddleHeight]);

  // Handle touch movement for mobile
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gameRunning) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    const paddleY = Math.max(0, Math.min(gameHeight - paddleHeight, touchY - paddleHeight / 2));
    setPlayerPaddle(paddleY);
  }, [gameRunning, gameHeight, paddleHeight]);

  // Game loop
  useEffect(() => {
    if (!gameRunning) return;

    const gameLoop = setInterval(() => {
      setBallPosition(prevPos => {
        let newX = prevPos.x + ballVelocity.x;
        let newY = prevPos.y + ballVelocity.y;
        let newVelX = ballVelocity.x;
        let newVelY = ballVelocity.y;

        // Ball collision with top and bottom walls
        if (newY <= 0) {
          newY = 0;
          newVelY = Math.abs(newVelY);
          setBallVelocity(prev => ({ ...prev, y: newVelY }));
        } else if (newY >= gameHeight - ballSize) {
          newY = gameHeight - ballSize;
          newVelY = -Math.abs(newVelY);
          setBallVelocity(prev => ({ ...prev, y: newVelY }));
        }

        // Ball collision with player paddle (right side)
        if (newX + ballSize >= gameWidth - paddleWidth &&
            newX <= gameWidth - paddleWidth &&
            newY + ballSize >= playerPaddle &&
            newY <= playerPaddle + paddleHeight &&
            ballVelocity.x > 0) {
          
          // Calculate hit position for angle variation
          const hitPos = ((newY + ballSize/2) - (playerPaddle + paddleHeight/2)) / (paddleHeight/2); // -1 to 1
          const angle = hitPos * Math.PI / 4; // Max 45 degree angle
          const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
          
          newVelX = -Math.abs(Math.cos(angle) * speed);
          newVelY = Math.sin(angle) * speed;
          newX = gameWidth - paddleWidth - ballSize;
          
          setBallVelocity({ x: newVelX, y: newVelY });
        }

        // Ball collision with AI paddle (left side)
        if (newX <= paddleWidth &&
            newX + ballSize >= 0 &&
            newY + ballSize >= aiPaddle &&
            newY <= aiPaddle + paddleHeight &&
            ballVelocity.x < 0) {
          
          const hitPos = ((newY + ballSize/2) - (aiPaddle + paddleHeight/2)) / (paddleHeight/2); // -1 to 1
          const angle = hitPos * Math.PI / 4; // Max 45 degree angle
          const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);
          
          newVelX = Math.abs(Math.cos(angle) * speed);
          newVelY = Math.sin(angle) * speed;
          newX = paddleWidth;
          
          setBallVelocity({ x: newVelX, y: newVelY });
        }

        // Ball goes off screen (scoring) - with safety bounds
        if (newX < -ballSize * 2) {
          setPlayerScore(prev => prev + 1);
          setTimeout(resetBall, 1000);
          return { x: gameWidth / 2, y: gameHeight / 2 };
        }

        if (newX > gameWidth + ballSize * 2) {
          setAiScore(prev => prev + 1);
          setTimeout(resetBall, 1000);
          return { x: gameWidth / 2, y: gameHeight / 2 };
        }

        // Ensure ball never goes completely off bounds
        newX = Math.max(-ballSize, Math.min(gameWidth + ballSize, newX));
        newY = Math.max(0, Math.min(gameHeight - ballSize, newY));

        return { x: newX, y: newY };
      });

      // AI paddle movement - scaled for game size
      setAiPaddle(prevPaddle => {
        const ballCenterY = ballPosition.y + ballSize / 2;
        const paddleCenterY = prevPaddle + paddleHeight / 2;
        const diff = ballCenterY - paddleCenterY;
        const aiSpeed = (difficultySettings[difficulty].aiSpeed * gameHeight) / 400; // Scale AI speed
        
        if (Math.abs(diff) < aiSpeed) return prevPaddle;
        
        const newPaddle = prevPaddle + (diff > 0 ? aiSpeed : -aiSpeed);
        return Math.max(0, Math.min(gameHeight - paddleHeight, newPaddle));
      });

    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameRunning, ballVelocity, ballPosition, playerPaddle, aiPaddle, difficulty, resetBall, gameWidth, gameHeight, paddleHeight, paddleWidth, ballSize]);

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
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <button
              onClick={onExit}
              className="bg-white/80 hover:bg-white text-gray-700 font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 w-full md:w-auto"
            >
              ← Back
            </button>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-medium w-full md:w-auto"
                disabled={gameRunning}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <div className="flex space-x-2 w-full md:w-auto">
                {!gameRunning && (playerScore < 5 && aiScore < 5) && (
                  <button
                    onClick={startGame}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 flex-1 md:flex-none text-sm md:text-base"
                  >
                    🚀 Start Game
                  </button>
                )}

                {gameRunning && (
                  <button
                    onClick={pauseGame}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 flex-1 md:flex-none text-sm md:text-base"
                  >
                    ⏸️ Pause
                  </button>
                )}

                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 flex-1 md:flex-none text-sm md:text-base"
                >
                  🔄 Reset
                </button>
              </div>
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
          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto" style={{ width: gameWidth, height: gameHeight, maxWidth: '100%' }}>
            {/* Game Canvas */}
            <div 
              ref={gameAreaRef}
              className="absolute inset-0 cursor-none select-none"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchStart={(e) => e.preventDefault()}
              style={{ width: '100%', height: '100%', touchAction: 'none' }}
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
                  <div className="text-center px-4">
                    <div className="text-2xl md:text-4xl font-bold text-white mb-4">
                      Ready to Play?
                    </div>
                    <p className="text-white/80 mb-6 text-sm md:text-base">
                      {isMobile ? 'Touch and drag to control the right paddle' : 'Move your mouse to control the right paddle'}
                    </p>
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
              <div className="text-4xl mb-3">{isMobile ? '👆' : '🖱️'}</div>
              <h4 className="font-semibold text-gray-800 mb-2">Control</h4>
              <p>
                {isMobile 
                  ? 'Touch and drag on the game area to move the right paddle up and down' 
                  : 'Move your mouse up and down to control the right paddle'
                }
              </p>
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
              {isMobile && <p>• For best experience, play in landscape mode on mobile devices</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pong;
