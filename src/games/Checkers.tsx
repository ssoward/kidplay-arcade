/**
 * Checkers Game Implementation with Double/Multiple Jump Support
 * 
 * Features:
 * - Standard checkers rules with 8x8 board
 * - King promotion when reaching opposite end
 * - Forced captures (must jump if available)
 * - Double/Multiple jumps (must continue jumping if additional captures available)
 * - AI opponent with capture prioritization
 * - Visual indicators for selected pieces, valid moves, and forced jumps
 * - Score tracking and game over detection
 */
import React, { useState, useCallback } from 'react';
import axios from 'axios';
// import './Chess.css';

interface CheckersProps {
  onExit: () => void;
}

interface Position {
  row: number;
  col: number;
}

interface Piece {
  player: 1 | 2;
  isKing: boolean;
}

type Board = (Piece | null)[][];

const BOARD_SIZE = 8;

const Checkers: React.FC<CheckersProps> = ({ onExit }) => {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [player1Score, setPlayer1Score] = useState(12);
  const [player2Score, setPlayer2Score] = useState(12);
  const [vsAI, setVsAI] = useState(true);
  const [mustJumpFrom, setMustJumpFrom] = useState<Position | null>(null); // Track piece that must continue jumping

  function initializeBoard(): Board {
    const board: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Place player 2 pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 2, isKing: false };
        }
      }
    }
    
    // Place player 1 pieces (bottom)
    for (let row = 5; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 1, isKing: false };
        }
      }
    }
    
    return board;
  }

  // Update scores when board changes
  React.useEffect(() => {
    const player1Pieces = board.flat().filter(p => p && p.player === 1).length;
    const player2Pieces = board.flat().filter(p => p && p.player === 2).length;
    setPlayer1Score(player1Pieces);
    setPlayer2Score(player2Pieces);
  }, [board]);

  // Check if a piece can capture from a specific position
  const getCaptures = useCallback((board: Board, position: Position): Position[] => {
    const piece = board[position.row][position.col];
    if (!piece) return [];

    const captures: Position[] = [];
    const { row, col } = position;
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
      : piece.player === 1 
        ? [[-1, -1], [-1, 1]] 
        : [[1, -1], [1, 1]];

    for (const [dRow, dCol] of directions) {
      const adjacentRow = row + dRow;
      const adjacentCol = col + dCol;
      
      if (adjacentRow >= 0 && adjacentRow < BOARD_SIZE && adjacentCol >= 0 && adjacentCol < BOARD_SIZE) {
        const adjacentPiece = board[adjacentRow][adjacentCol];
        if (adjacentPiece && adjacentPiece.player !== piece.player) {
          const jumpRow = adjacentRow + dRow;
          const jumpCol = adjacentCol + dCol;
          
          if (jumpRow >= 0 && jumpRow < BOARD_SIZE && jumpCol >= 0 && jumpCol < BOARD_SIZE && !board[jumpRow][jumpCol]) {
            captures.push({ row: jumpRow, col: jumpCol });
          }
        }
      }
    }

    return captures;
  }, []);

  const getValidMoves = useCallback((board: Board, position: Position, capturesOnly: boolean = false): Position[] => {
    const piece = board[position.row][position.col];
    if (!piece) return [];

    const moves: Position[] = [];
    const { row, col } = position;
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
      : piece.player === 1 
        ? [[-1, -1], [-1, 1]] 
        : [[1, -1], [1, 1]];

    // Check for captures first
    const captures = getCaptures(board, position);
    if (captures.length > 0) {
      return captures; // Must capture if available
    }

    // If we're only looking for captures or if a piece must continue jumping, return empty
    if (capturesOnly || mustJumpFrom) {
      return [];
    }

    // Regular moves (only if no captures available)
    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && !board[newRow][newCol]) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }, [getCaptures, mustJumpFrom]);

  const makeMove = useCallback((from: Position, to: Position) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;
    
    // Check if it's a capture move
    const rowDiff = Math.abs(to.row - from.row);
    let isCapture = false;
    
    if (rowDiff === 2) {
      isCapture = true;
      const captureRow = from.row + (to.row - from.row) / 2;
      const captureCol = from.col + (to.col - from.col) / 2;
      newBoard[captureRow][captureCol] = null;
    }
    
    // Move piece
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    // Check for king promotion
    if (!piece.isKing) {
      if ((piece.player === 1 && to.row === 0) || (piece.player === 2 && to.row === 7)) {
        newBoard[to.row][to.col]!.isKing = true;
      }
    }
    
    setBoard(newBoard);
    
    // If it was a capture, check for additional captures (double/multi jumps)
    if (isCapture) {
      const additionalCaptures = getCaptures(newBoard, to);
      if (additionalCaptures.length > 0) {
        // Must continue jumping with the same piece
        setMustJumpFrom(to);
        setSelectedPosition(to);
        setValidMoves(additionalCaptures);
        return; // Don't switch players yet
      }
    }
    
    // Reset forced jump state
    setMustJumpFrom(null);
    setSelectedPosition(null);
    setValidMoves([]);
    
    // Check for win condition
    const player1Pieces = newBoard.flat().filter(p => p && p.player === 1).length;
    const player2Pieces = newBoard.flat().filter(p => p && p.player === 2).length;
    
    if (player1Pieces === 0) {
      setWinner(2);
      setGameOver(true);
    } else if (player2Pieces === 0) {
      setWinner(1);
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  }, [board, currentPlayer, getCaptures]);

  // Get all possible moves for a player, prioritizing captures
  const getAllPossibleMoves = useCallback((board: Board, player: 1 | 2) => {
    const moves: Array<{from: Position, to: Position}> = [];
    let hasCaptures = false;
    
    // First pass: look for captures
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece && piece.player === player) {
          const captures = getCaptures(board, { row, col });
          if (captures.length > 0) {
            hasCaptures = true;
            captures.forEach(capture => {
              moves.push({ from: { row, col }, to: capture });
            });
          }
        }
      }
    }
    
    // If there are captures available, only return captures (forced jumps)
    if (hasCaptures) {
      return moves;
    }
    
    // Second pass: regular moves (only if no captures available)
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece && piece.player === player) {
          const regularMoves = getValidMoves(board, { row, col }, false);
          regularMoves.forEach(move => {
            moves.push({ from: { row, col }, to: move });
          });
        }
      }
    }
    
    return moves;
  }, [getCaptures, getValidMoves]);

  // AI move logic
  React.useEffect(() => {
    if (!vsAI || gameOver || currentPlayer !== 2) return;

    // If AI must continue jumping, handle that first
    if (mustJumpFrom && mustJumpFrom) {
      const captures = getCaptures(board, mustJumpFrom);
      if (captures.length > 0) {
        setTimeout(() => {
          // Use backend AI for forced jump
          makeAIMove(mustJumpFrom, captures);
        }, 1000);
        return;
      }
    }

    const aiMoves = getAllPossibleMoves(board, 2);
    if (aiMoves.length > 0) {
      setTimeout(() => {
        // Use backend AI for move selection
        makeAIMove(null, aiMoves.map(m => m.to));
      }, 1000);
    }
  }, [vsAI, gameOver, currentPlayer, board, mustJumpFrom, getAllPossibleMoves, makeMove, getCaptures]);

  // Backend AI move function
  const makeAIMove = async (from: Position | null, possibleMoves: Position[]) => {
    try {
      // Prepare a simple board state for the backend
      const boardState = board.map(row => row.map(piece => {
        if (!piece) return null;
        return { player: piece.player, isKing: piece.isKing };
      }));
      const payload = {
        board: boardState,
        currentPlayer: 2,
        mustJumpFrom: from,
        possibleMoves,
        systemPrompt: CHECKERS_SYSTEM_PROMPT,
      };
      const res = await axios.post('/api/ask-ai', { checkers: payload });
      // Accept both { move: {row, col} } and { from: {row, col}, to: {row, col} }
      if (res.data && res.data.move) {
        // If AI returns just the move (to position), find the corresponding from position
        let moveTo = res.data.move;
        let moveFrom = from;
        if (!moveFrom) {
          // Try to find the move in all possible moves
          const moveObj = getAllPossibleMoves(board, 2).find(m => m.to.row === moveTo.row && m.to.col === moveTo.col);
          if (moveObj) moveFrom = moveObj.from;
        }
        if (moveFrom && moveTo) {
          makeMove(moveFrom, moveTo);
          return;
        }
      } else if (res.data && res.data.from && res.data.to) {
        makeMove(res.data.from, res.data.to);
        return;
      }
      // fallback: pick random move
      if (from && possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        makeMove(from, randomMove);
      } else if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const moveObj = getAllPossibleMoves(board, 2).find(m => m.to.row === randomMove.row && m.to.col === randomMove.col);
        if (moveObj) makeMove(moveObj.from, moveObj.to);
      }
    } catch (e) {
      // fallback: pick random move
      if (from && possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        makeMove(from, randomMove);
      } else if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const moveObj = getAllPossibleMoves(board, 2).find(m => m.to.row === randomMove.row && m.to.col === randomMove.col);
        if (moveObj) makeMove(moveObj.from, moveObj.to);
      }
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;
    
    const piece = board[row][col];
    
    // If we must jump from a specific piece, only allow that piece to be selected
    if (mustJumpFrom) {
      if (selectedPosition) {
        // Try to make a jump move
        const isValid = validMoves.some(m => m.row === row && m.col === col);
        if (isValid) {
          makeMove(selectedPosition, { row, col });
        }
        // Don't allow deselection during forced jumps
      } else if (piece && mustJumpFrom.row === row && mustJumpFrom.col === col) {
        // Only allow selecting the piece that must continue jumping
        setSelectedPosition({ row, col });
        setValidMoves(getCaptures(board, { row, col }));
      }
      return;
    }
    
    if (selectedPosition) {
      // Try to move
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      if (isValid) {
        makeMove(selectedPosition, { row, col });
      } else if (piece && piece.player === currentPlayer && (!vsAI || currentPlayer === 1)) {
        // Select new piece
        setSelectedPosition({ row, col });
        setValidMoves(getValidMoves(board, { row, col }));
      } else {
        // Deselect
        setSelectedPosition(null);
        setValidMoves([]);
      }
    } else if (piece && piece.player === currentPlayer && (!vsAI || currentPlayer === 1)) {
      // Select piece
      setSelectedPosition({ row, col });
      setValidMoves(getValidMoves(board, { row, col }));
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer(1);
    setSelectedPosition(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
    setPlayer1Score(12);
    setPlayer2Score(12);
    setMustJumpFrom(null); // Reset forced jump state
  };

  // Test function to set up a double jump scenario
  const setupDoubleJumpTest = () => {
    const testBoard: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Set up a scenario where player 1 can make a double jump
    testBoard[5][0] = { player: 1, isKing: false }; // Player 1 piece
    testBoard[4][1] = { player: 2, isKing: false }; // First opponent piece to jump
    testBoard[2][3] = { player: 2, isKing: false }; // Second opponent piece to jump
    
    // Add some other pieces for context
    testBoard[7][2] = { player: 1, isKing: false };
    testBoard[0][1] = { player: 2, isKing: false };
    testBoard[0][3] = { player: 2, isKing: false };
    
    setBoard(testBoard);
    setCurrentPlayer(1);
    setSelectedPosition(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
    setMustJumpFrom(null);
    
    // Update scores based on test board
    const player1Pieces = testBoard.flat().filter(p => p && p.player === 1).length;
    const player2Pieces = testBoard.flat().filter(p => p && p.player === 2).length;
    setPlayer1Score(player1Pieces);
    setPlayer2Score(player2Pieces);
  };

  // Instruct the AI to play as strongly as possible
  const CHECKERS_SYSTEM_PROMPT =
    'You are a checkers AI. Play as strongly as possible. Given the current board and possible moves, select the best move for the player. Respond ONLY with the move object as JSON.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent drop-shadow-lg">
            Checkers 🔴⚫
          </h1>
          <p className="text-xl text-gray-700">Jump your way to victory!</p>
        </div>

        {/* Game Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-blue-800">Player 1</div>
              <div className="text-2xl font-bold text-blue-600">{player1Score}</div>
              <div className="text-sm text-blue-700">Pieces</div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-orange-800">
                {gameOver ? '🎉 Game Over!' : mustJumpFrom ? '⚡ Must Continue Jumping!' : `Player ${currentPlayer}'s Turn`}
              </div>
              {mustJumpFrom && (
                <div className="text-sm text-orange-600 mt-1">Continue your multi-jump!</div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-red-800">{vsAI ? 'AI' : 'Player 2'}</div>
              <div className="text-2xl font-bold text-red-600">{player2Score}</div>
              <div className="text-sm text-red-700">Pieces</div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <div className="grid grid-cols-8 gap-1 max-w-lg mx-auto bg-gradient-to-br from-amber-800 to-amber-900 p-4 rounded-xl shadow-inner">
            {board.map((row, rowIndex) => 
              row.map((piece, colIndex) => {
                const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex;
                const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
                const isMustJump = mustJumpFrom?.row === rowIndex && mustJumpFrom?.col === colIndex;
                const isDarkSquare = (rowIndex + colIndex) % 2 === 1;
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105
                      ${isDarkSquare ? 'bg-amber-900' : 'bg-amber-200'}
                      ${isSelected ? 'ring-4 ring-blue-400 shadow-lg' : ''}
                      ${isValidMove ? 'ring-4 ring-green-400 bg-green-200 animate-pulse' : ''}
                      ${isMustJump ? 'ring-4 ring-yellow-400 bg-yellow-200 animate-bounce' : ''}
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <div className={`
                        w-full h-full rounded-full flex items-center justify-center text-2xl font-bold transform transition-all duration-200
                        ${piece.player === 1 
                          ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg' 
                          : 'bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg'
                        }
                        ${piece.isKing ? 'border-4 border-yellow-400' : ''}
                        hover:scale-110
                      `}>
                        {piece.isKing ? '♔' : (piece.player === 1 ? '●' : '●')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setVsAI(!vsAI)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              🤖 {vsAI ? 'Play vs Human' : 'Play vs AI'}
            </button>
            <button 
              onClick={resetGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              🔄 New Game
            </button>
            <button 
              onClick={setupDoubleJumpTest}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              ⚡ Test Double Jump
            </button>
            <button 
              onClick={onExit}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              🏠 Exit Game
            </button>
          </div>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Game Over!
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Winner: <span className="font-bold text-purple-600">
                  {winner === 1 ? 'Player 1' : (vsAI ? 'AI' : 'Player 2')}
                </span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={resetGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  🎮 Play Again
                </button>
                <button 
                  onClick={onExit}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  🏠 Return to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkers;
