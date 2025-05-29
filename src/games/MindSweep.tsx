import React, { useState, useEffect, useCallback } from 'react';
import './Chess.css';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
};

type Grid = Cell[][];

type Difficulty = 'easy' | 'medium' | 'hard';

const difficulties = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 20 },
  hard: { rows: 15, cols: 15, mines: 40 }
};

const MindSweep: React.FC = () => {
  const defaultConfig = difficulties['easy'];
  const [grid, setGrid] = useState<Grid>(
    Array(defaultConfig.rows).fill(null).map(() =>
      Array(defaultConfig.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0
      }))
    )
  );
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [mineCount, setMineCount] = useState(10);
  const [flagCount, setFlagCount] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [firstClick, setFirstClick] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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
                if (newGrid[newRow][newCol].isMine) {
                  count++;
                }
              }
            }
          }
          
          newGrid[row][col].neighborCount = count;
        }
      }
    }
    
    return newGrid;
  }, []);

  const initializeGame = useCallback(() => {
    const config = difficulties[difficulty];
    const emptyGrid = createEmptyGrid(config.rows, config.cols);
    
    setGrid(emptyGrid);
    setGameStatus('playing');
    setMineCount(config.mines);
    setFlagCount(0);
    setFirstClick(true);
    setTimer(0);
    setIsRunning(false);
  }, [difficulty, createEmptyGrid]);

  const revealCellRecursively = useCallback((grid: Grid, row: number, col: number): Grid => {
    const rows = grid.length;
    const cols = grid[0].length;
    
    if (row < 0 || row >= rows || col < 0 || col >= cols) return grid;
    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return grid;
    
    grid[row][col].isRevealed = true;
    
    if (grid[row][col].neighborCount === 0 && !grid[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCellRecursively(grid, row + dr, col + dc);
        }
      }
    }
    
    return grid;
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return;
    
    setGrid(prevGrid => {
      let newGrid = prevGrid.map(r => r.map(c => ({ ...c })));
      
      if (firstClick) {
        newGrid = placeMines(newGrid, mineCount, row, col);
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
  }, [gameStatus, firstClick, mineCount, placeMines, calculateNeighbors, revealCellRecursively]);

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

  const getCellContent = (cell: Cell): string => {
    if (cell.isRevealed) {
      return cell.isMine ? '💣' : cell.neighborCount > 0 ? cell.neighborCount.toString() : '';
    }
    return cell.isFlagged ? '🚩' : '';
  };

  return (
    <div className="mind-sweep">
      <h1>Mind Sweep</h1>
      <div className="game-info">
        <div>Timer: {timer}s</div>
        <div>Mines Left: {mineCount - flagCount}</div>
        <div>Status: {gameStatus === 'playing' ? 'In Progress' : gameStatus === 'won' ? 'You Won!' : 'You Lost!'}</div>
      </div>
      <div className="difficulty">
        <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={() => changeDifficulty('easy')}>Easy</button>
        <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={() => changeDifficulty('medium')}>Medium</button>
        <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={() => changeDifficulty('hard')}>Hard</button>
      </div>
      <div className="grid" style={{
        display: 'grid',
        gridTemplateRows: `repeat(${grid.length}, 1fr)`,
        gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(32px, 1fr))`,
        border: '2px solid #888',
        background: '#bdbdbd',
        minHeight: '40vw',
        minWidth: '40vw',
        maxWidth: '98vw',
        maxHeight: '98vw',
        width: '100%',
        aspectRatio: '1/1',
        boxSizing: 'border-box',
        gap: '2vw',
        margin: '0 auto',
        touchAction: 'manipulation',
      }}>
        {grid.length > 0 && grid[0]?.length > 0 && grid.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={`${row}-${col}`}
              className={`cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isFlagged ? 'flagged' : ''}`}
              style={{
                border: '1px solid #888',
                background: cell.isRevealed ? '#e0e0e0' : '#9e9e9e',
                width: '100%',
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 'min(6vw, 2.2rem)',
                userSelect: 'none',
                touchAction: 'manipulation',
                boxSizing: 'border-box',
                transition: 'background 0.2s',
              }}
              onClick={() => handleCellClick(row, col)}
              onContextMenu={e => handleRightClick(e, row, col)}
            >
              {getCellContent(cell)}
            </div>
          ))
        )}
      </div>
      <button className="chess-btn bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-60 mt-4" onClick={initializeGame}>Restart</button>
    </div>
  );
};

export default MindSweep;
