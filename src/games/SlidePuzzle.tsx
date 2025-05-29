import React, { useState, useEffect, useCallback } from 'react';
// import './Chess.css';

type Grid = (number | null)[][];

const SlidePuzzle: React.FC = () => {
  const [size, setSize] = useState(3);
  const [grid, setGrid] = useState<Grid>([]);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const createSolvedGrid = useCallback((size: number): Grid => {
    const grid: Grid = [];
    let num = 1;
    
    for (let i = 0; i < size; i++) {
      grid[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === size - 1 && j === size - 1) {
          grid[i][j] = null; // Empty space
        } else {
          grid[i][j] = num++;
        }
      }
    }
    
    return grid;
  }, []);

  const shuffleGrid = useCallback((grid: Grid): Grid => {
    const size = grid.length;
    const newGrid = grid.map(row => [...row]);
    
    // Find empty space
    let emptyRow = size - 1;
    let emptyCol = size - 1;
    
    // Perform 1000 random moves to shuffle
    for (let i = 0; i < 1000; i++) {
      const possibleMoves: [number, number][] = [];
      
      // Check possible moves
      if (emptyRow > 0) possibleMoves.push([-1, 0]);
      if (emptyRow < size - 1) possibleMoves.push([1, 0]);
      if (emptyCol > 0) possibleMoves.push([0, -1]);
      if (emptyCol < size - 1) possibleMoves.push([0, 1]);
      
      // Pick random move
      const [dr, dc] = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      const newRow = emptyRow + dr;
      const newCol = emptyCol + dc;
      
      // Swap
      newGrid[emptyRow][emptyCol] = newGrid[newRow][newCol];
      newGrid[newRow][newCol] = null;
      
      emptyRow = newRow;
      emptyCol = newCol;
    }
    
    return newGrid;
  }, []);

  const initializeGame = useCallback(() => {
    const solvedGrid = createSolvedGrid(size);
    const shuffledGrid = shuffleGrid(solvedGrid);
    setGrid(shuffledGrid);
    setMoves(0);
    setTimer(0);
    setIsCompleted(false);
    setIsRunning(true);
  }, [size, createSolvedGrid, shuffleGrid]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isCompleted) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isCompleted]);

  const findEmptySpace = useCallback((grid: Grid): [number, number] => {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === null) {
          return [i, j];
        }
      }
    }
    return [-1, -1];
  }, []);

  const canMove = useCallback((grid: Grid, row: number, col: number): boolean => {
    const [emptyRow, emptyCol] = findEmptySpace(grid);
    
    // Check if the clicked tile is adjacent to empty space
    const rowDiff = Math.abs(row - emptyRow);
    const colDiff = Math.abs(col - emptyCol);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, [findEmptySpace]);

  const makeMove = useCallback((row: number, col: number) => {
    if (isCompleted || !canMove(grid, row, col)) return;
    
    const newGrid = grid.map(row => [...row]);
    const [emptyRow, emptyCol] = findEmptySpace(grid);
    
    // Swap the clicked tile with empty space
    newGrid[emptyRow][emptyCol] = newGrid[row][col];
    newGrid[row][col] = null;
    
    setGrid(newGrid);
    setMoves(moves + 1);
    
    // Check if puzzle is solved
    const isSolved = checkIfSolved(newGrid);
    if (isSolved) {
      setIsCompleted(true);
      setIsRunning(false);
    }
  }, [grid, moves, isCompleted, canMove, findEmptySpace]);

  const checkIfSolved = useCallback((grid: Grid): boolean => {
    let expectedNum = 1;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (i === grid.length - 1 && j === grid[i].length - 1) {
          // Last cell should be empty
          return grid[i][j] === null;
        } else {
          if (grid[i][j] !== expectedNum) {
            return false;
          }
          expectedNum++;
        }
      }
    }
    
    return true;
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTileColor = (value: number | null, row: number, col: number): string => {
    if (value === null) return 'bg-gray-200';
    
    const canMoveThis = canMove(grid, row, col);
    const baseColor = 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
    const hoverColor = canMoveThis ? 'hover:from-blue-300 hover:to-blue-500 hover:scale-105' : '';
    const cursor = canMoveThis ? 'cursor-pointer' : 'cursor-not-allowed';
    
    return `${baseColor} ${hoverColor} ${cursor}`;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Slide Puzzle 🧩</h1>
        <p className="text-lg opacity-90">Arrange the tiles in order by sliding them into the empty space!</p>
      </div>

      {/* Size Selection */}
      <div className="mb-4 flex space-x-2">
        {[3, 4, 5].map((gridSize) => (
          <button
            key={gridSize}
            onClick={() => setSize(gridSize)}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 transform hover:scale-105 ${
              size === gridSize 
                ? 'bg-white text-purple-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {gridSize}×{gridSize}
          </button>
        ))}
      </div>

      {/* Game Stats */}
      <div className="mb-4 flex items-center space-x-6 bg-white/20 rounded-2xl p-4">
        <div className="text-center">
          <div className="text-2xl font-bold">🔄</div>
          <div className="text-lg font-semibold">{moves}</div>
          <div className="text-sm">Moves</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">⏱️</div>
          <div className="text-lg font-semibold">{formatTime(timer)}</div>
          <div className="text-sm">Time</div>
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="mb-4 text-2xl font-bold text-center bg-white/20 rounded-2xl p-4">
          🎉 Puzzle Complete! 🎉
          <div className="text-lg mt-2">
            Solved in {moves} moves and {formatTime(timer)}!
          </div>
        </div>
      )}

      {/* Puzzle Grid */}
      <div className="bg-white/20 p-4 rounded-2xl shadow-2xl mb-6">
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${size}, 1fr)` 
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((value, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => makeMove(rowIndex, colIndex)}
                disabled={isCompleted || value === null}
                className={`
                  bg-gradient-to-br from-white to-gray-100 hover:from-gray-50 hover:to-gray-200 text-gray-800 font-bold shadow-lg border-2 border-white/30
                  w-16 h-16 text-xl font-bold rounded-lg
                  transition-all duration-200 active:scale-95 hover:scale-105
                  ${getTileColor(value, rowIndex, colIndex)}
                `}
              >
                {value}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={initializeGame}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-60 transform hover:scale-105"
        >
          New Game
        </button>
      </div>

      {/* Rules */}
      <div className="bg-white/10 rounded-2xl p-6 max-w-md text-center">
        <h3 className="font-bold text-lg mb-3">How to Play 📚</h3>
        <ul className="text-sm space-y-1 text-left">
          <li>• Click on a number tile next to the empty space</li>
          <li>• The tile will slide into the empty space</li>
          <li>• Arrange all numbers in order: 1, 2, 3, etc.</li>
          <li>• The empty space should be in the bottom-right corner</li>
          <li>• Try to solve it in as few moves as possible!</li>
        </ul>
      </div>
    </div>
  );
};

export default SlidePuzzle;
