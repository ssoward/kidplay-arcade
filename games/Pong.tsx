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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-yellow-100 to-pink-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Pong 🏓</h1>
        <p className="text-lg opacity-90">Classic arcade action! (Full game coming soon!)</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center text-2xl text-gray-500">
          Pong coming soon!<br />
          (A full-featured version is in development.)
        </div>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🏓</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Use your paddle to bounce the ball</li>
          <li>• Try to score against your opponent</li>
          <li>• First to 10 points wins!</li>
        </ul>
      </div>
    </div>
  );
};

export default Pong;
