import React, { useState, useEffect, useCallback } from 'react';
import './Chess.css';

const ROWS = 6;
const COLS = 7;

const ConnectFour: React.FC = () => {
  const [board, setBoard] = React.useState<(0 | 1 | 2)[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [currentPlayer, setCurrentPlayer] = React.useState<1 | 2>(1);
  const [winner, setWinner] = React.useState<1 | 2 | 0>(0);
  const [gameOver, setGameOver] = React.useState(false);

  const checkWinner = (b: (0 | 1 | 2)[][]): 0 | 1 | 2 => {
    // Horizontal, vertical, diagonal checks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] !== 0) {
          // Horizontal
          if (c + 3 < COLS && b[r][c] === b[r][c + 1] && b[r][c] === b[r][c + 2] && b[r][c] === b[r][c + 3]) return b[r][c];
          // Vertical
          if (r + 3 < ROWS && b[r][c] === b[r + 1][c] && b[r][c] === b[r + 2][c] && b[r][c] === b[r + 3][c]) return b[r][c];
          // Diagonal /
          if (r - 3 >= 0 && c + 3 < COLS && b[r][c] === b[r - 1][c + 1] && b[r][c] === b[r - 2][c + 2] && b[r][c] === b[r - 3][c + 3]) return b[r][c];
          // Diagonal \
          if (r + 3 < ROWS && c + 3 < COLS && b[r][c] === b[r + 1][c + 1] && b[r][c] === b[r + 2][c + 2] && b[r][c] === b[r + 3][c + 3]) return b[r][c];
        }
      }
    }
    return 0;
  };

  const handleDrop = (col: number) => {
    if (gameOver) return;
    const newBoard = board.map(row => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === 0) {
        newBoard[r][col] = currentPlayer;
        break;
      }
    }
    const win = checkWinner(newBoard);
    setBoard(newBoard);
    if (win) {
      setWinner(win);
      setGameOver(true);
    } else if (newBoard.every(row => row.every(cell => cell !== 0))) {
      setWinner(0);
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setCurrentPlayer(1);
    setWinner(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Connect Four 🟡🔴</h1>
        <p className="text-lg opacity-90">Drop your discs and connect four in a row to win!</p>
      </div>
      <div className="mb-6 flex flex-col items-center">
        <div className="bg-white/80 rounded-full px-6 py-3 shadow text-lg font-semibold mb-2">
          <span className={currentPlayer === 1 ? 'text-yellow-500' : 'text-red-500'}>
            {currentPlayer === 1 ? 'Player 1 (🟡)' : 'Player 2 (🔴)'}
          </span>
        </div>
        {gameOver && (
          <div className="mb-4 text-center bg-yellow-100 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-yellow-800 mb-2">
              {winner === 0 ? 'It\'s a Tie! 🤝' : winner === 1 ? 'Player 1 (🟡) Wins! 🎉' : 'Player 2 (🔴) Wins! 🎉'}
            </div>
            <button
              onClick={resetGame}
              className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
            >
              Play Again
            </button>
          </div>
        )}
        <div className="bg-blue-200 p-4 rounded-2xl shadow-2xl mb-6">
          <div className="grid grid-cols-7 gap-1 border-4 border-blue-400">
            {Array.from({ length: ROWS }).map((_, r) =>
              Array.from({ length: COLS }).map((_, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleDrop(c)}
                  className={`w-10 h-10 md:w-14 md:h-14 border-0 transition-all flex items-center justify-center p-0 m-0
                    ${board[r][c] === 1 ? 'bg-yellow-400' : board[r][c] === 2 ? 'bg-red-500' : 'bg-white hover:bg-blue-100'}
                    rounded-full shadow-lg`}
                  aria-label={`Row ${r + 1}, Col ${c + 1}`}
                  disabled={!!board[0][c] || gameOver}
                >
                  {board[r][c] === 1 ? '🟡' : board[r][c] === 2 ? '🔴' : ''}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🟡🔴</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Click a column to drop your disc</li>
          <li>• Connect four of your color in a row (horizontally, vertically, or diagonally) to win</li>
          <li>• Take turns with a friend!</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectFour;
