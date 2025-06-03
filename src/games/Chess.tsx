import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chess as ChessEngine } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import AnalyticsService from '../services/AnalyticsService';
// import './Chess.css';

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
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  const safeGameMutate = (modify: (game: any) => void) => {
    setGame((g: any) => {
      const update = new ChessEngine(g.fen());
      modify(update);
      setFen(update.fen());
      setHistory(update.history({ verbose: false }));
      
      const isGameEnded = update.isGameOver();
      const newStatus = isGameEnded
        ? update.isCheckmate()
          ? 'Checkmate!'
          : update.isDraw()
          ? 'Draw!'
          : 'Game over'
        : update.turn() === 'w' ? 'White to move' : 'Black to move';
      
      setStatus(newStatus);
      
      // Record analytics when game ends
      if (isGameEnded && !gameOver) {
        setGameOver(true);
        const analytics = AnalyticsService.getInstance();
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const moves = update.history().length;
        
        let gameResult = 'draw';
        if (update.isCheckmate()) {
          gameResult = update.turn() === 'w' ? 'black_wins' : 'white_wins';
        }
        
        analytics.recordGameSession({
          gameType: 'Chess',
          score: moves, // Use move count as score
          duration: duration,
          completed: true,
          metadata: {
            gameMode: vsAI ? 'vs_ai' : 'vs_human',
            result: gameResult,
            totalMoves: moves,
            winner: update.isCheckmate() ? (update.turn() === 'w' ? 'Black' : 'White') : 'Draw'
          }
        });
      }
      
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
    setSessionStartTime(Date.now()); // Reset session timer
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl">♛</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
              Chess Master
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Classic chess for two players or challenge the AI! Drag and drop pieces to move.
          </p>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                boardWidth={Math.min(400, window.innerWidth - 100)}
                customBoardStyle={{ 
                  boxShadow: '0 8px 32px rgba(80,0,120,0.10)', 
                  borderRadius: 18, 
                  border: '2px solid #e0e7ff' 
                }}
                customSquareStyles={selectedSquare ? { 
                  [selectedSquare]: { boxShadow: '0 0 0 4px #f9d423 inset' } 
                } : {}}
              />
            </div>
            
            {/* Status Bar */}
            <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl w-full max-w-md">
              <div className="text-center">
                <div className={`text-lg font-bold mb-3 ${
                  status.includes('White') ? 'text-blue-600' : 
                  status.includes('Black') ? 'text-purple-600' : 
                  'text-gray-600'
                }`}>
                  {status}
                </div>
                <button 
                  onClick={onNewGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  🔄 New Game
                </button>
              </div>
            </div>
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
            {/* How to Play */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-center text-purple-700 flex items-center justify-center gap-2">
                📚 How to Play
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                  Drag and drop pieces to move
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                  Standard chess rules apply
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                  Play with a friend or vs AI
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
                  Click "New Game" to reset
                </li>
              </ul>
            </div>

            {/* Game Mode Toggle */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-center text-green-700 flex items-center justify-center gap-2">
                🎮 Game Mode
              </h3>
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-lg font-semibold text-gray-700">
                    Currently: <span className="text-purple-600">{vsAI ? 'vs AI' : 'vs Friend'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setVsAI(!vsAI)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  {vsAI ? '👥 Play vs Friend' : '🤖 Play vs AI'}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-center text-orange-700 flex items-center justify-center gap-2">
                💡 Chess Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Control the center of the board</li>
                <li>• Develop knights before bishops</li>
                <li>• Castle early for king safety</li>
                <li>• Look for tactics: pins, forks, skewers</li>
                <li>• Think before you move!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chess;
