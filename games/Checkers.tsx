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
    <div className="checkers-bg">
      <div className="checkers-container">
        {/* Game Status */}
        <div className="checkers-status">
          <div className="checkers-player-info">
            <div className="checkers-player-name">Player 1</div>
            <div className="checkers-player-score">Pieces: {player1Score}</div>
          </div>
          <div className="checkers-turn-indicator">
            {gameOver ? `Game Over!` : mustJumpFrom ? `Player ${currentPlayer} must continue jumping!` : `Player ${currentPlayer}'s Turn`}
          </div>
          <div className="checkers-player-info">
            <div className="checkers-player-name">{vsAI ? 'AI' : 'Player 2'}</div>
            <div className="checkers-player-score">Pieces: {player2Score}</div>
          </div>
        </div>

        {/* Game Board */}
        <div className="checkers-board">
          {board.map((row, rowIndex) => 
            row.map((piece, colIndex) => {
              const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex;
              const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
              const isMustJump = mustJumpFrom?.row === rowIndex && mustJumpFrom?.col === colIndex;
              const isDarkSquare = (rowIndex + colIndex) % 2 === 1;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`checkers-square ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''} ${isMustJump ? 'must-jump' : ''}`}
                  style={{
                    backgroundColor: isDarkSquare ? '#8b4513' : '#f5deb3'
                  }}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {piece && (
                    <div className={`checkers-piece player${piece.player} ${piece.isKing ? 'king' : ''}`}>
                      {piece.isKing ? '♔' : (piece.player === 1 ? '●' : '●')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Game Controls */}
        <div className="checkers-controls">
          <button 
            className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" 
            onClick={() => setVsAI(!vsAI)}
          >
            {vsAI ? 'Play vs Human' : 'Play vs AI'}
          </button>
          <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={resetGame}>
            New Game
          </button>
          <button 
            className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" 
            onClick={setupDoubleJumpTest}
            style={{ backgroundColor: '#ff6b35' }}
          >
            Test Double Jump
          </button>
          <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={onExit}>
            Exit Game
          </button>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="checkers-overlay">
            <div className="checkers-message">
              <h2>Game Over!</h2>
              <p>Winner: {winner === 1 ? 'Player 1' : (vsAI ? 'AI' : 'Player 2')}</p>
              <div className="checkers-controls">
                <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={resetGame}>
                  Play Again
                </button>
                <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={onExit}>
                  Return to Menu
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
