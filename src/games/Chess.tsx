import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chess as ChessEngine } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './Chess.css';

const CHESS_SYSTEM_PROMPT =
  'You are a chess AI. Play as strongly as possible. Given the current board in FEN notation and a list of legal moves, select the best move for the current player. Respond ONLY with the move in standard algebraic notation (e.g., e2e4).';

const Chess: React.FC = () => {
  const [game, setGame] = useState(() => new ChessEngine());
  const [fen, setFen] = useState<string>(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [status, setStatus] = useState('White to move');
  const [vsAI, setVsAI] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  const safeGameMutate = (modify: (game: any) => void) => {
    setGame((g: any) => {
      const update = new ChessEngine(g.fen());
      modify(update);
      setFen(update.fen());
      setHistory(update.history({ verbose: false }));
      setStatus(
        update.isGameOver()
          ? update.isCheckmate()
            ? 'Checkmate!'
            : update.isDraw()
            ? 'Draw!'
            : 'Game over'
          : update.turn() === 'w' ? 'White to move' : 'Black to move'
      );
      return update;
    });
  };

  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    let moveMade = false;
    safeGameMutate((game: any) => {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      moveMade = !!move;
      if (moveMade && vsAI && currentPlayer === 1 && !game.isGameOver()) {
        setCurrentPlayer(2); // Switch to AI turn
      }
    });
    return moveMade;
  }

  function onSquareClick(square: string) {
    setSelectedSquare(square);
  }

  function onNewGame() {
    const newGame = new ChessEngine();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setStatus('White to move');
    setSelectedSquare(null);
    setGameOver(false);
    setCurrentPlayer(1);
  }

  // Function to get AI move from backend
  const getAIMove = async (fen: string, legalMoves: string[]) => {
    try {
      const payload = {
        board: fen,
        possibleMoves: legalMoves,
        systemPrompt: CHESS_SYSTEM_PROMPT,
      };
      const res = await axios.post('/api/ask-ai', { chess: payload });
      if (res.data && res.data.move) {
        return res.data.move;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Function to get legal moves in algebraic notation
  const getLegalMoves = (game: any) => {
    // If using chess.js, use moves({ verbose: false })
    return game.moves();
  };

  // Function to get FEN from board/game
  const getFENFromBoard = (game: any) => {
    return game.fen();
  };

  // Example: useEffect to trigger AI move when it's AI's turn
  useEffect(() => {
    if (vsAI && currentPlayer === 2 && !gameOver) {
      const fen = getFENFromBoard(game);
      const legalMoves = getLegalMoves(game);
      getAIMove(fen, legalMoves).then((aiMove) => {
        if (aiMove) {
          safeGameMutate((game: any) => {
            game.move(aiMove);
          });
          setCurrentPlayer(1);
        }
      });
    }
  }, [vsAI, currentPlayer, game, gameOver]);

  return (
    <div className="chess-bg">
      <div className="chess-container">
        <div className="chess-header">
          <div className="chess-title-row">
            <span className="chess-icon">♛</span>
            <h1 className="chess-title">Chess Master</h1>
          </div>
          <p className="chess-subtitle">
            Classic chess for two players or challenge the AI! Drag and drop pieces to move. Toggle below to play with a friend or against the AI.
          </p>
        </div>
        <div className="chess-board-section">
          <Chessboard
            position={fen}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            boardWidth={360}
            customBoardStyle={{ boxShadow: '0 8px 32px rgba(80,0,120,0.10)', borderRadius: 18, border: '2px solid #e0e7ff' }}
            customSquareStyles={selectedSquare ? { [selectedSquare]: { boxShadow: '0 0 0 4px #f9d423 inset' } } : {}}
          />
          <div className="chess-status-bar">
            <span className={status.includes('White') ? 'chess-status-white' : status.includes('Black') ? 'chess-status-black' : 'chess-status-neutral'}>
              {status}
            </span>
            <button 
              className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
              onClick={onNewGame}
            >
              New Game
            </button>
          </div>
        </div>
        <div className="chess-info-card">
          <h3 className="chess-info-title">How to Play <span role="img" aria-label="book">📚</span></h3>
          <ul className="chess-info-list">
            <li>• Drag and drop pieces to move</li>
            <li>• Standard chess rules apply</li>
            <li>• Play with a friend <b>or</b> vs AI</li>
            <li>• Click "New Game" to reset</li>
            <li>• Use the toggle below to switch between AI and friend mode</li>
          </ul>
        </div>
        <div className="chess-controls flex justify-center gap-4 mt-6">
          <button 
            className="chess-btn bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-60"
            onClick={() => setVsAI(!vsAI)}
          >
            {vsAI ? 'Play vs Friend' : 'Play vs AI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chess;
