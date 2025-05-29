import React, { useState, useCallback } from 'react';

interface Difference {
  id: number;
  x: number;
  y: number;
  size: number;
  found: boolean;
}

const SpotDifference: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [foundDifferences, setFoundDifferences] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [clicks, setClicks] = useState(0);

  const levels = [
    {
      level: 1,
      title: "Garden Scene",
      description: "Find 5 differences in this peaceful garden",
      totalDifferences: 5,
      backgroundImage: "🌸🌿🦋🌺🌸🌿🌳🌺🌸🌿🦋🌺🌸🌿🌳🌺",
      pattern: "garden"
    },
    {
      level: 2,
      title: "Ocean Beach",
      description: "Spot 6 differences by the seaside",
      totalDifferences: 6,
      backgroundImage: "🏖️🌊🐚⭐🏖️🌊🐙⭐🏖️🌊🐚⭐🏖️🌊🐙⭐",
      pattern: "beach"
    },
    {
      level: 3,
      title: "Space Adventure",
      description: "Find 7 differences in outer space",
      totalDifferences: 7,
      backgroundImage: "🚀🌟🛸👽🚀🌟🪐👽🚀🌟🛸👽🚀🌟🪐👽",
      pattern: "space"
    }
  ];

  const generateDifferences = useCallback(() => {
    const level = levels[currentLevel - 1];
    const newDifferences: Difference[] = [];
    
    for (let i = 0; i < level.totalDifferences; i++) {
      newDifferences.push({
        id: i,
        x: Math.random() * 80 + 10, // Keep within bounds (10-90%)
        y: Math.random() * 80 + 10,
        size: Math.random() * 20 + 15, // Size between 15-35px
        found: false
      });
    }
    
    setDifferences(newDifferences);
  }, [currentLevel]);

  const startGame = () => {
    setGameStarted(true);
    setGameCompleted(false);
    setFoundDifferences([]);
    setScore(0);
    setTimeElapsed(0);
    setClicks(0);
    generateDifferences();
  };

  const nextLevel = () => {
    if (currentLevel < levels.length) {
      setCurrentLevel(prev => prev + 1);
      startGame();
    } else {
      setGameCompleted(true);
    }
  };

  const resetGame = () => {
    setCurrentLevel(1);
    setGameStarted(false);
    setGameCompleted(false);
    setFoundDifferences([]);
    setScore(0);
    setTimeElapsed(0);
    setClicks(0);
  };

  // Timer effect
  React.useEffect(() => {
    if (!gameStarted || gameCompleted) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  const handleImageClick = (e: React.MouseEvent, imageIndex: number) => {
    if (!gameStarted || gameCompleted) return;

    setClicks(prev => prev + 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is near any difference
    for (const diff of differences) {
      if (foundDifferences.includes(diff.id)) continue;

      const distance = Math.sqrt(
        Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2)
      );

      if (distance <= diff.size / 2) {
        // Found a difference!
        const newFound = [...foundDifferences, diff.id];
        setFoundDifferences(newFound);
        setScore(prev => prev + 100);

        // Check if all differences found
        if (newFound.length === differences.length) {
          setGameCompleted(true);
          // Bonus points for time and fewer clicks
          const timeBonus = Math.max(0, 300 - timeElapsed * 2);
          const clickBonus = Math.max(0, 200 - clicks * 5);
          setScore(prev => prev + timeBonus + clickBonus);
        }
        return;
      }
    }

    // Wrong click penalty
    setScore(prev => Math.max(0, prev - 10));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generatePattern = (pattern: string, withDifferences: boolean) => {
    const level = levels[currentLevel - 1];
    const emojis = Array.from(level.backgroundImage);
    
    return Array(64).fill(null).map((_, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      let emoji = emojis[index % emojis.length];
      
      // Add differences to right image
      if (withDifferences) {
        differences.forEach(diff => {
          const diffRow = Math.floor((diff.y / 100) * 8);
          const diffCol = Math.floor((diff.x / 100) * 8);
          
          if (row === diffRow && col === diffCol && !foundDifferences.includes(diff.id)) {
            // Change emoji for difference
            const alternateEmojis = {
              '🌸': '🌹', '🌿': '🍀', '🦋': '🐛', '🌺': '🌻', '🌳': '🌲',
              '🏖️': '🏝️', '🌊': '💧', '🐚': '🐠', '⭐': '💫', '🐙': '🦑',
              '🚀': '🛰️', '🌟': '✨', '🛸': '🌍', '👽': '🤖', '🪐': '🌙'
            };
            emoji = alternateEmojis[emoji as keyof typeof alternateEmojis] || emoji;
          }
        });
      }
      
      return emoji;
    });
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Spot the Difference 👀</h1>
          <p className="text-lg opacity-90">Find all the differences between two pictures!</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="bg-white/80 rounded-2xl p-8 shadow-lg text-center text-2xl text-gray-500">
            Spot the Difference coming soon!<br />
            (A full-featured version is in development.)
          </div>
        </div>
        <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
          <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 👀</h3>
          <ul className="text-gray-700 space-y-1 text-left">
            <li>• Carefully compare the two images</li>
            <li>• Click on all the differences you find</li>
            <li>• Find them all to win!</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button onClick={resetGame} className="reset-btn">Reset</button>
      </div>

      <div className="game-content">
        <div className="game-info">
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Score:</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time:</span>
              <span className="stat-value">{formatTime(timeElapsed)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Found:</span>
              <span className="stat-value">{foundDifferences.length}/{differences.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Clicks:</span>
              <span className="stat-value">{clicks}</span>
            </div>
          </div>

          {gameCompleted && (
            <div className="game-over">
              <h2>🎉 Level Complete!</h2>
              <p>You found all {differences.length} differences!</p>
              <p>Final Score: {score} points</p>
              {currentLevel < levels.length ? (
                <button onClick={nextLevel} className="next-level-btn">Next Level</button>
              ) : (
                <div>
                  <p>🏆 Congratulations! You completed all levels!</p>
                  <button onClick={resetGame} className="play-again-btn">Play Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="spot-difference-game">
          <div className="images-container">
            <div className="image-section">
              <h3>Original</h3>
              <div 
                className="game-image original"
                onClick={(e) => handleImageClick(e, 0)}
              >
                <div className="emoji-grid">
                  {generatePattern(levels[currentLevel - 1].pattern, false).map((emoji, index) => (
                    <span key={index} className="emoji-cell">{emoji}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="image-section">
              <h3>Find the Differences</h3>
              <div 
                className="game-image differences"
                onClick={(e) => handleImageClick(e, 1)}
              >
                <div className="emoji-grid">
                  {generatePattern(levels[currentLevel - 1].pattern, true).map((emoji, index) => (
                    <span key={index} className="emoji-cell">{emoji}</span>
                  ))}
                </div>
                
                {/* Mark found differences */}
                {differences.map(diff => (
                  foundDifferences.includes(diff.id) && (
                    <div
                      key={diff.id}
                      className="found-marker"
                      style={{
                        left: `${diff.x}%`,
                        top: `${diff.y}%`,
                        width: `${diff.size}px`,
                        height: `${diff.size}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      ✓
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="game-rules">
          <h3>How to Play:</h3>
          <ul>
            <li>Click on the differences you spot in the right image</li>
            <li>Find all differences to complete the level</li>
            <li>Be careful - wrong clicks reduce your score!</li>
            <li>Faster completion gives bonus points</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpotDifference;
