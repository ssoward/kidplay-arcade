import React, { useState, useEffect, useCallback } from 'react';
import './Chess.css';

type SudokuGrid = (number | null)[][];

const Sudoku: React.FC = () => {
  const [grid, setGrid] = useState<SudokuGrid>(() => Array(9).fill(null).map(() => Array(9).fill(null)));
  const [solution, setSolution] = useState<SudokuGrid>(() => Array(9).fill(null).map(() => Array(9).fill(null)));
  const [originalGrid, setOriginalGrid] = useState<SudokuGrid>(() => Array(9).fill(null).map(() => Array(9).fill(null)));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const isValidMove = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (r !== row && c !== col && grid[r][c] === num) return false;
      }
    }

    return true;
  };

  const solveSudoku = (grid: SudokuGrid): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValidMove(grid, row, col, num)) {
              grid[row][col] = num;
              if (solveSudoku(grid)) {
                return true;
              }
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const generateSudoku = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    // Create a complete valid sudoku
    const newGrid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // Fill diagonal 3x3 boxes first
    for (let box = 0; box < 3; box++) {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = 8; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      
      let numIndex = 0;
      for (let row = box * 3; row < box * 3 + 3; row++) {
        for (let col = box * 3; col < box * 3 + 3; col++) {
          newGrid[row][col] = numbers[numIndex++];
        }
      }
    }

    // Solve the rest
    solveSudoku(newGrid);
    const completeSolution = newGrid.map(row => [...row]);

    // Remove numbers based on difficulty
    const cellsToRemove = {
      easy: 40,
      medium: 50,
      hard: 60
    }[difficulty];

    const positions = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        positions.push([i, j]);
      }
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Remove cells
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const [row, col] = positions[i];
      newGrid[row][col] = null;
    }

    setGrid(newGrid.map(row => [...row]));
    setOriginalGrid(newGrid.map(row => [...row]));
    setSolution(completeSolution);
    setErrors(new Set());
    setCompleted(false);
  }, []);

  useEffect(() => {
    generateSudoku(difficulty);
  }, [difficulty, generateSudoku]);

  const handleCellClick = (row: number, col: number) => {
    if (originalGrid[row][col] !== null) return; // Can't modify original numbers
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    
    if (originalGrid[row][col] !== null) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = num;
    setGrid(newGrid);

    // Check for errors
    const newErrors = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellValue = newGrid[r][c];
        if (cellValue !== null && !isValidMove(newGrid, r, c, cellValue)) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);

    // Check if completed
    const isComplete = newGrid.every(row => row.every(cell => cell !== null)) && newErrors.size === 0;
    setCompleted(isComplete);
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    
    if (originalGrid[row][col] !== null) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = null;
    setGrid(newGrid);

    // Recheck errors
    const newErrors = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellValue = newGrid[r][c];
        if (cellValue !== null && !isValidMove(newGrid, r, c, cellValue)) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);
    setCompleted(false);
  };

  const showHint = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    
    if (originalGrid[row][col] !== null) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[row][col] = solution[row][col];
    setGrid(newGrid);
    
    setErrors(new Set());
    
    const isComplete = newGrid.every(row => row.every(cell => cell !== null));
    setCompleted(isComplete);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-yellow-100 to-pink-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Sudoku 🧩</h1>
        <p className="text-lg opacity-90">Fill the grid so every row, column, and box contains 1-9!</p>
      </div>

      {/* Sudoku Grid */}
      <div className="sudoku-board" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, minmax(28px, 1fr))',
        gridTemplateRows: 'repeat(9, minmax(28px, 1fr))',
        gap: '2px',
        maxWidth: '98vw',
        width: '100%',
        aspectRatio: '1/1',
        background: '#e5e7eb',
        border: '4px solid #334155',
        borderRadius: '18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        margin: '0 auto',
        padding: '2vw',
        boxSizing: 'border-box',
      }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
            const isOriginal = originalGrid[rowIndex][colIndex] !== null;
            const hasError = errors.has(`${rowIndex}-${colIndex}`);
            const isThickBorder = (rowIndex % 3 === 2 && rowIndex !== 8) || (colIndex % 3 === 2 && colIndex !== 8);
            
            return (
              <input
                key={`${rowIndex}-${colIndex}`}
                className={`sudoku-cell${isOriginal ? ' original' : ''}${isSelected ? ' selected' : ''}${hasError ? ' error' : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: 'min(5vw, 2rem)',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  background: isSelected ? '#fef9c3' : isOriginal ? '#e0f7fa' : '#f1f5f9',
                  color: isOriginal ? '#00695c' : '#222',
                  border: '1.5px solid #64748b',
                  borderRadius: '8px',
                  outline: isSelected ? '2px solid #f59e42' : 'none',
                  boxShadow: isSelected ? '0 0 8px #fde68a' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  caretColor: isOriginal ? '#00695c' : 'transparent',
                }}
                value={cell || ''}
                maxLength={1}
                inputMode="numeric"
                disabled={!isOriginal}
                onFocus={() => handleCellClick(rowIndex, colIndex)}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '') {
                    handleClear();
                  } else {
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                      handleNumberInput(num);
                    }
                  }
                }}
                aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
              />
            );
          })
        )}
      </div>
      <div className="sudoku-controls" style={{
        marginTop: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
      }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
            style={{
              width: '44px',
              height: '44px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '2px solid #64748b',
              background: '#fff',
              color: '#2563eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'background 0.2s',
              userSelect: 'none',
              touchAction: 'manipulation',
            }}
            onClick={() => handleNumberInput(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
          style={{
            width: '44px',
            height: '44px',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid #64748b',
            background: '#fff',
            color: '#ef4444',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'manipulation',
          }}
          onClick={handleClear}
        >
          ⌫
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => generateSudoku(difficulty)}
          className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full font-semibold transition-all"
        >
          New Game
        </button>
        <button
          onClick={showHint}
          disabled={!selectedCell}
          className="bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold transition-all"
        >
          💡 Hint
        </button>
      </div>

      {/* Error count */}
      {errors.size > 0 && (
        <div className="mb-4 text-red-200 bg-red-500/20 rounded-full px-4 py-2">
          ⚠️ {errors.size} error{errors.size !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Rules */}
      <div className="bg-white/10 rounded-2xl p-6 max-w-md text-center">
        <h3 className="font-bold text-lg mb-3">How to Play 📚</h3>
        <ul className="text-sm space-y-1 text-left">
          <li>• Fill each row with numbers 1-9</li>
          <li>• Fill each column with numbers 1-9</li>
          <li>• Fill each 3×3 box with numbers 1-9</li>
          <li>• No number can repeat in any row, column, or box!</li>
          <li>• Click a cell to select it, then click a number</li>
        </ul>
      </div>
    </div>
  );
};

export default Sudoku;
