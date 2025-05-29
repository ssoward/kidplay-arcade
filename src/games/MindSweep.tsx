import React, { useState, useEffect, useCallback } from 'react';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
};

type Grid = Cell[][];

type Difficulty = 'easy' | 'medium' | 'hard';

const difficulties = {
  easy: { rows: 9, cols: 9, mines: 10, name: 'Beginner' },
  medium: { rows: 12, cols: 12, mines: 20, name: 'Intermediate' },
  hard: { rows: 15, cols: 15, mines: 40, name: 'Expert' }
};

const MindSweep: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [grid, setGrid] = useState<Grid>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagCount, setFlagCount] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const config = difficulties[difficulty];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameStatus]);

  const createEmptyGrid = useCallback((rows: number, cols: number): Grid => {
    return Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0
      }))
    );
  }, []);

  const placeMines = useCallback((grid: Grid, mineCount: number, excludeRow: number, excludeCol: number): Grid => {
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (newGrid[row][col].isMine) continue;
      
      const isAdjacent = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
      if (isAdjacent) continue;
      
      newGrid[row][col].isMine = true;
      minesPlaced++;
    }
    
    return newGrid;
  }, []);

  const calculateNeighbors = useCallback((grid: Grid): Grid => {
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              
              const newRow = row + dr;
              const newCol = col + dc;
              
              if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                if (newGrid[newRow][newCol].isMine) count++;
              }
            }
          }
          
          newGrid[row][col].neighborCount = count;
        }
      }
    }
    
    return newGrid;
  }, []);

  const revealCellRecursively = useCallback((grid: Grid, row: number, col: number): Grid => {
    const rows = grid.length;
    const cols = grid[0].length;
    
    if (row < 0 || row >= rows || col < 0 || col >= cols) return grid;
    
    const cell = grid[row][col];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return grid;
    
    cell.isRevealed = true;
    
    if (cell.neighborCount === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCellRecursively(grid, row + dr, col + dc);
        }
      }
    }
    
    return grid;
  }, []);

  const initializeGame = useCallback(() => {
    const newGrid = createEmptyGrid(config.rows, config.cols);
    setGrid(newGrid);
    setGameStatus('playing');
    setFlagCount(0);
    setFirstClick(true);
    setTimer(0);
    setIsRunning(false);
  }, [config.rows, config.cols, createEmptyGrid]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return;
    
    setGrid(prevGrid => {
      let newGrid = prevGrid.map(r => r.map(c => ({ ...c })));
      
      if (firstClick) {
        newGrid = placeMines(newGrid, config.mines, row, col);
        newGrid = calculateNeighbors(newGrid);
        setFirstClick(false);
        setIsRunning(true);
      }
      
      const cell = newGrid[row][col];
      if (cell.isRevealed || cell.isFlagged) return newGrid;
      
      if (cell.isMine) {
        newGrid.forEach(r => {
          r.forEach(c => {
            if (c.isMine) c.isRevealed = true;
          });
        });
        setGameStatus('lost');
        setIsRunning(false);
        return newGrid;
      }
      
      newGrid = revealCellRecursively(newGrid, row, col);
      
      const hasWon = newGrid.every(r =>
        r.every(c => c.isMine || c.isRevealed)
      );
      
      if (hasWon) {
        setGameStatus('won');
        setIsRunning(false);
        newGrid.forEach(r => {
          r.forEach(c => {
            if (c.isMine && !c.isFlagged) {
              c.isFlagged = true;
              setFlagCount(prev => prev + 1);
            }
          });
        });
      }
      
      return newGrid;
    });
  }, [gameStatus, firstClick, config.mines, placeMines, calculateNeighbors, revealCellRecursively]);

  const handleRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing') return;
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];
      
      if (cell.isRevealed) return newGrid;
      
      if (cell.isFlagged) {
        cell.isFlagged = false;
        setFlagCount(prev => prev - 1);
      } else {
        cell.isFlagged = true;
        setFlagCount(prev => prev + 1);
      }
      
      return newGrid;
    });
  }, [gameStatus]);

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCellContent = (cell: Cell): string => {
    if (cell.isRevealed) {
      return cell.isMine ? '💣' : cell.neighborCount > 0 ? cell.neighborCount.toString() : '';
    }
    return cell.isFlagged ? '🚩' : '';
  };

  const getCellStyles = (cell: Cell): string => {
    let baseStyles = 'w-full h-full border border-gray-400 flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer select-none';
    
    if (cell.isRevealed) {
      if (cell.isMine) {
        baseStyles += ' bg-red-500 text-white';
      } else {
        baseStyles += ' bg-gray-200 hover:bg-gray-300';
        // Number colors
        if (cell.neighborCount === 1) baseStyles += ' text-blue-600';
        else if (cell.neighborCount === 2) baseStyles += ' text-green-600';
        else if (cell.neighborCount === 3) baseStyles += ' text-red-600';
        else if (cell.neighborCount === 4) baseStyles += ' text-purple-600';
        else if (cell.neighborCount === 5) baseStyles += ' text-yellow-600';
        else if (cell.neighborCount === 6) baseStyles += ' text-pink-600';
        else if (cell.neighborCount === 7) baseStyles += ' text-black';
        else if (cell.neighborCount === 8) baseStyles += ' text-gray-600';
      }
    } else {
      if (cell.isFlagged) {
        baseStyles += ' bg-yellow-300 hover:bg-yellow-400';
      } else {
        baseStyles += ' bg-gray-400 hover:bg-gray-500 active:bg-gray-300';
      }
    }
    
    return baseStyles;
  };

  const getGridSize = (): string => {
    if (config.rows <= 9) return 'max-w-md';
    if (config.rows <= 12) return 'max-w-lg';
    return 'max-w-2xl';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💣 Mind Sweep</h1>
          <p className="text-gray-600">Clear the field without hitting any mines!</p>
        </div>

        {/* Game Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Difficulty Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(difficulties).map(([key, difficultyConfig]) => (
                <button
                  key={key}
                  onClick={() => changeDifficulty(key as Difficulty)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    difficulty === key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {difficultyConfig.name}
                  <span className="block text-xs opacity-75">
                    {difficultyConfig.rows}×{difficultyConfig.cols}, {difficultyConfig.mines} mines
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⏱️</span>
                <span className="font-mono text-lg font-semibold text-gray-700">
                  {formatTime(timer)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚩</span>
                <span className="font-mono text-lg font-semibold text-gray-700">
                  {flagCount}/{config.mines}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xl">💣</span>
                <span className="font-mono text-lg font-semibold text-gray-700">
                  {Math.max(0, config.mines - flagCount)}
                </span>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            >
              New Game
            </button>
          </div>

          {/* Game Status */}
          {gameStatus !== 'playing' && (
            <div className={`text-center p-4 rounded-lg mb-4 ${
              gameStatus === 'won' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="text-2xl mb-2">
                {gameStatus === 'won' ? '🎉' : '💥'}
              </div>
              <div className="font-bold text-lg">
                {gameStatus === 'won' ? 'Congratulations! You Won!' : 'Game Over! You Hit a Mine!'}
              </div>
              <div className="text-sm mt-1">
                {gameStatus === 'won' 
                  ? `Completed in ${formatTime(timer)}` 
                  : 'Better luck next time!'
                }
              </div>
            </div>
          )}
        </div>

        {/* Game Grid */}
        <div className="flex justify-center">
          <div className={`${getGridSize()} w-full`}>
            <div 
              className="bg-white rounded-xl shadow-lg p-4 inline-block"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                gap: '1px',
                backgroundColor: '#374151'
              }}
            >
              {grid.map((rowArr, row) =>
                rowArr.map((cell, col) => (
                  <div
                    key={`${row}-${col}`}
                    className={getCellStyles(cell)}
                    style={{
                      minWidth: difficulty === 'hard' ? '20px' : '30px',
                      minHeight: difficulty === 'hard' ? '20px' : '30px',
                      maxWidth: '40px',
                      maxHeight: '40px',
                      aspectRatio: '1/1'
                    }}
                    onClick={() => handleCellClick(row, col)}
                    onContextMenu={e => handleRightClick(e, row, col)}
                  >
                    {getCellContent(cell)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">How to Play</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Basic Controls:</h4>
              <ul className="space-y-1">
                <li>• <strong>Left click</strong> to reveal a cell</li>
                <li>• <strong>Right click</strong> to flag/unflag a mine</li>
                <li>• Numbers show nearby mine count</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Objective:</h4>
              <ul className="space-y-1">
                <li>• Reveal all cells without mines</li>
                <li>• Use numbers to deduce mine locations</li>
                <li>• Flag suspected mines with 🚩</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindSweep;
