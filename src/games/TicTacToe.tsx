import React, { useState, useEffect } from 'react';

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'tie' | null>(null);
  const [isVsAI, setIsVsAI] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  const checkWinner = (board: Board): Player | 'tie' | null => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) {
      return 'tie';
    }
    return null;
  };

  const makeAIMove = (currentBoard: Board): number => {
    // Simple AI that tries to win, block, or take center/corners
    const availableMoves = currentBoard.map((cell, index) => cell === null ? index : null)
                                     .filter(val => val !== null) as number[];

    // Try to win
    for (const move of availableMoves) {
      const testBoard = [...currentBoard];
      testBoard[move] = 'O';
      if (checkWinner(testBoard) === 'O') {
        return move;
      }
    }

    // Try to block player from winning
    for (const move of availableMoves) {
      const testBoard = [...currentBoard];
      testBoard[move] = 'X';
      if (checkWinner(testBoard) === 'X') {
        return move;
      }
    }

    // Take center if available
    if (currentBoard[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => currentBoard[corner] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available spot
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
      setScores(prev => ({
        ...prev,
        [gameResult === 'tie' ? 'ties' : gameResult]: prev[gameResult === 'tie' ? 'ties' : gameResult] + 1
      }));
      return;
    }

    if (isVsAI && currentPlayer === 'X') {
      setCurrentPlayer('O');
    } else if (!isVsAI) {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  useEffect(() => {
    if (isVsAI && currentPlayer === 'O' && !winner) {
      const timer = setTimeout(() => {
        const aiMove = makeAIMove(board);
        const newBoard = [...board];
        newBoard[aiMove] = 'O';
        setBoard(newBoard);

        const gameResult = checkWinner(newBoard);
        if (gameResult) {
          setWinner(gameResult);
          setScores(prev => ({
            ...prev,
            [gameResult === 'tie' ? 'ties' : gameResult]: prev[gameResult === 'tie' ? 'ties' : gameResult] + 1
          }));
        } else {
          setCurrentPlayer('X');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, board, isVsAI, winner, checkWinner, makeAIMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, ties: 0 });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 via-pink-100 to-purple-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Tic-Tac-Toe ✖️⭕</h1>
        <p className="text-lg opacity-90">Get three in a row! Play against a friend or the AI.</p>
      </div>
      <div className="mb-6 text-center">
        <div className="bg-white/80 rounded-full p-1 inline-flex shadow">
          <button
            onClick={() => setIsVsAI(true)}
            className={`px-4 py-2 rounded-full transition-all duration-200 font-semibold text-lg
              ${isVsAI ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            vs AI 🤖
          </button>
          <button
            onClick={() => setIsVsAI(false)}
            className={`px-4 py-2 rounded-full transition-all duration-200 font-semibold text-lg
              ${!isVsAI ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            2 Players 👥
          </button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-4 text-center max-w-xs mx-auto">
        <div className="bg-blue-100 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">X</div>
          <div className="text-lg font-semibold">{scores.X}</div>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-600">Ties</div>
          <div className="text-lg font-semibold">{scores.ties}</div>
        </div>
        <div className="bg-red-100 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600">O</div>
          <div className="text-lg font-semibold">{scores.O}</div>
        </div>
      </div>
      <div className="text-center mb-6">
        {winner ? (
          <div className="text-2xl font-bold">
            {winner === 'tie' ? (
              <span className="text-gray-600">It's a Tie! 🤝</span>
            ) : (
              <span className={winner === 'X' ? 'text-blue-600' : 'text-red-600'}>
                {winner} Wins! 🎉
              </span>
            )}
          </div>
        ) : (
          <div className="text-xl font-semibold">
            Current Player: <span className={currentPlayer === 'X' ? 'text-blue-600' : 'text-red-600'}>{currentPlayer}</span>
            {isVsAI && currentPlayer === 'O' && ' (AI thinking...)'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6 mx-auto w-72 h-72">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className={`bg-white border-2 border-gray-300 rounded-xl text-5xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg
              hover:bg-blue-50 active:scale-95
              ${cell === 'X' ? 'text-blue-600' : cell === 'O' ? 'text-red-600' : 'text-gray-400'}`}
            disabled={!!cell || !!winner || (isVsAI && currentPlayer === 'O')}
            aria-label={cell ? `Cell ${index + 1}: ${cell}` : `Cell ${index + 1}: empty`}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={resetGame}
          className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 shadow"
        >
          New Game
        </button>
        <button
          onClick={resetScores}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 shadow"
        >
          Reset Scores
        </button>
      </div>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play ✖️⭕</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Click or tap a square to place your mark</li>
          <li>• Get three in a row (horizontally, vertically, or diagonally) to win</li>
          <li>• Play against a friend or the computer</li>
          <li>• Track your wins and ties!</li>
        </ul>
      </div>
    </div>
  );
};

export default TicTacToe;
