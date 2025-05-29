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
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
            Spot the Difference 👀
          </h1>
          <p className="text-xl text-gray-700">Find all the differences between two pictures!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* Levels Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-purple-700">🎯 Levels</h2>
            <div className="space-y-4">
              {levels.map((level, index) => (
                <div key={level.level} className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <h3 className="font-bold text-lg text-purple-800">{level.title}</h3>
                  <p className="text-sm text-purple-600">{level.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-purple-200 px-2 py-1 rounded-full">
                      {level.totalDifferences} differences
                    </span>
                    <span className="text-lg">{level.backgroundImage.slice(0, 4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Start Button and Instructions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Ready to Play?
              </h2>
              <p className="text-gray-600 mb-6">
                Test your observation skills and find all the hidden differences!
              </p>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 text-xl"
            >
              🎮 Start Game
            </button>

            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-orange-800">💡 Quick Tips</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Look carefully at every detail</li>
                <li>• Click on the right image when you spot a difference</li>
                <li>• Wrong clicks will reduce your score</li>
                <li>• Find all differences to advance to the next level</li>
              </ul>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-green-700">📋 How to Play</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <h3 className="font-bold text-green-800">Compare Images</h3>
                  <p className="text-sm text-green-600">Look at both images side by side</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <h3 className="font-bold text-green-800">Find Differences</h3>
                  <p className="text-sm text-green-600">Spot the changes between them</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <h3 className="font-bold text-green-800">Click to Mark</h3>
                  <p className="text-sm text-green-600">Click on the right image to mark differences</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <div>
                  <h3 className="font-bold text-green-800">Complete Level</h3>
                  <p className="text-sm text-green-600">Find all differences to win!</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-blue-800">🏆 Scoring</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• +100 points per difference found</li>
                <li>• Time bonus for quick completion</li>
                <li>• Click accuracy bonus</li>
                <li>• -10 points for wrong clicks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {levels[currentLevel - 1].title} - Level {currentLevel}
        </h1>
        <button 
          onClick={resetGame} 
          className="bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          🏠 Home
        </button>
      </div>

      {/* Game Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-blue-800">Score</div>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-600">{formatTime(timeElapsed)}</div>
            <div className="text-sm text-green-800">Time</div>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3">
            <div className="text-2xl font-bold text-purple-600">{foundDifferences.length}/{differences.length}</div>
            <div className="text-sm text-purple-800">Found</div>
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-3">
            <div className="text-2xl font-bold text-orange-600">{clicks}</div>
            <div className="text-sm text-orange-800">Clicks</div>
          </div>
        </div>
      </div>

      {/* Game Completed Modal */}
      {gameCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Level Complete!
            </h2>
            <p className="text-lg text-gray-700 mb-2">You found all {differences.length} differences!</p>
            <p className="text-xl font-bold text-purple-600 mb-6">Final Score: {score} points</p>
            
            {currentLevel < levels.length ? (
              <button 
                onClick={nextLevel}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 mb-4 w-full"
              >
                🚀 Next Level
              </button>
            ) : (
              <div className="mb-4">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-lg font-bold text-purple-600 mb-4">Congratulations! You completed all levels!</p>
              </div>
            )}
            
            <button 
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 w-full"
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Images */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold text-gray-700">{levels[currentLevel - 1].description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-purple-700">Original 📷</h3>
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <div 
                    className="grid grid-cols-8 gap-1 cursor-pointer select-none"
                    onClick={(e) => handleImageClick(e, 0)}
                  >
                    {generatePattern(levels[currentLevel - 1].pattern, false).map((emoji, index) => (
                      <div key={index} className="text-2xl text-center hover:scale-110 transition-transform duration-200">
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Differences Image */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-purple-700">Find the Differences 🔍</h3>
                <div className="relative bg-gradient-to-br from-pink-50 to-yellow-50 rounded-xl p-4 border-2 border-pink-200">
                  <div 
                    className="grid grid-cols-8 gap-1 cursor-pointer select-none relative"
                    onClick={(e) => handleImageClick(e, 1)}
                  >
                    {generatePattern(levels[currentLevel - 1].pattern, true).map((emoji, index) => (
                      <div key={index} className="text-2xl text-center hover:scale-110 transition-transform duration-200">
                        {emoji}
                      </div>
                    ))}
                    
                    {/* Found Difference Markers */}
                    {differences.map(diff => (
                      foundDifferences.includes(diff.id) && (
                        <div
                          key={diff.id}
                          className="absolute bg-green-400 border-2 border-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse"
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
          </div>
        </div>

        {/* Instructions and Progress */}
        <div className="space-y-6">
          {/* Current Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center text-purple-700">🎯 Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Level:</span>
                <span className="font-bold text-purple-600">{currentLevel} / {levels.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(foundDifferences.length / differences.length) * 100}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {foundDifferences.length} of {differences.length} differences found
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center text-green-700">📋 Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                Click on the differences you spot in the right image
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                Find all differences to complete the level
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                Be careful - wrong clicks reduce your score!
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
                Faster completion gives bonus points
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-center text-orange-700">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Look for changes in colors, shapes, or objects</li>
              <li>• Check every section of both images carefully</li>
              <li>• Some differences might be very subtle</li>
              <li>• Take your time - accuracy matters more than speed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDifference;
