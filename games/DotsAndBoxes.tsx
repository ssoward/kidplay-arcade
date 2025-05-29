import React, { useState } from 'react';
import axios from 'axios';

// Types
interface Line {
  row: number;
  col: number;
  orientation: 'h' | 'v';
}

type Player = 1 | 2;

interface Box {
  owner: Player | null;
}

// Constants
const GRID_SIZE = 5; // 5x5 dots = 4x4 boxes
const BOXES = GRID_SIZE - 1;

// Helper to create initial state
function createInitialState() {
  // Horizontal lines: (GRID_SIZE-1) rows, GRID_SIZE cols
  const hLines = Array.from({ length: BOXES + 1 }, () => Array(BOXES).fill(false));
  // Vertical lines: GRID_SIZE rows, (GRID_SIZE-1) cols
  const vLines = Array.from({ length: BOXES }, () => Array(BOXES + 1).fill(false));
  // Boxes: (GRID_SIZE-1) x (GRID_SIZE-1)
  const boxes: Box[][] = Array.from({ length: BOXES }, () => Array(BOXES).fill(null).map(() => ({ owner: null })));
  return { hLines, vLines, boxes };
}

const DotsAndBoxes: React.FC = () => {
  const [hLines, setHLines] = useState(createInitialState().hLines);
  const [vLines, setVLines] = useState(createInitialState().vLines);
  const [boxes, setBoxes] = useState(createInitialState().boxes);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [scores, setScores] = useState<{ 1: number; 2: number }>({ 1: 0, 2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isVsAI, setIsVsAI] = useState(false);
  const [aiThinking, setAIThinking] = useState(false);

  // Dots and Boxes AI system prompt
  const DOTS_SYSTEM_PROMPT = `You are a Dots and Boxes AI. Follow this strict priority order:\n\n1. If there is a box with exactly 3 sides filled, complete it. Check all boxes before making any move.\n\n2. If no boxes can be completed, play a move that does not create a 3-sided box for the opponent, do NOT repeat moves.\n\n3. If all remaining moves will create a 3-sided box, choose the one that minimizes the opponent's follow-up gain.\n\nRespond ONLY with a JSON object: { row, col, orientation } where orientation is \"h\" or \"v\".`;

  // Draw a line
  const handleLineClick = (
    row: number,
    col: number,
    orientation: 'h' | 'v',
    skipAI?: boolean,
    afterMove?: (boardState: { hLines: boolean[][]; vLines: boolean[][]; boxes: Box[][] }) => void
  ) => {
    if (gameOver || aiThinking) return;
    let newHLines = hLines, newVLines = vLines;
    if (orientation === 'h') {
      if (hLines[row][col]) return;
      newHLines = hLines.map(arr => [...arr]);
      newHLines[row][col] = true;
    } else {
      if (vLines[row][col]) return;
      newVLines = vLines.map(arr => [...arr]);
      newVLines[row][col] = true;
    }
    // Always use the updated lines for box calculation
    const { updatedBoxes, anyCompleted } = getCompletedBoxes(newHLines, newVLines, orientation, row, col, currentPlayer, boxes);
    setHLines(newHLines);
    setVLines(newVLines);
    setBoxes(updatedBoxes);
    // Calculate new scores from updatedBoxes
    const playerScore = updatedBoxes.flat().filter(b => b.owner === currentPlayer).length;
    setScores(prev => ({ ...prev, [currentPlayer]: playerScore }));
    // Call afterMove callback with the latest board state
    if (afterMove) {
      afterMove({ hLines: newHLines, vLines: newVLines, boxes: updatedBoxes });
    }
    // If any box was completed, player gets another turn (do not switch)
    if (anyCompleted) {
      return;
    } else {
      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      // Removed direct AI trigger here to prevent double AI moves/loops
    }
  };

  // Helper to check for completed boxes and return updated boxes
  function getCompletedBoxes(hL: boolean[][], vL: boolean[][], orientation: 'h' | 'v', row: number, col: number, player: Player, prevBoxes: Box[][]) {
    let anyCompleted = false;
    const affected: Array<[number, number]> = [];
    if (orientation === 'h') {
      if (row > 0) affected.push([row - 1, col]);
      if (row < BOXES) affected.push([row, col]);
    } else {
      if (col > 0) affected.push([row, col - 1]);
      if (col < BOXES) affected.push([row, col]);
    }
    const updatedBoxes = prevBoxes.map(arr => arr.map(box => ({ ...box })));
    affected.forEach(([r, c]) => {
      if (
        hL[r][c] &&
        hL[r + 1][c] &&
        vL[r][c] &&
        vL[r][c + 1] &&
        !updatedBoxes[r][c].owner
      ) {
        updatedBoxes[r][c].owner = player;
        anyCompleted = true;
      }
    });
    return { updatedBoxes, anyCompleted };
  }

  // Helper to serialize board state for AI
  const getBoardState = () => ({ hLines, vLines, boxes });

  // AI move (accepts optional board state override)
  const makeAIMove = async (boardOverride?: { hLines: boolean[][]; vLines: boolean[][]; boxes: Box[][] }) => {
    if (aiThinking) return; // Prevent double-trigger
    setAIThinking(true);
    try {
      const boardState = boardOverride || getBoardState();
      // Removed boardConfig from payload to restore backend compatibility
      const res = await axios.post('/api/ask-ai', {
        game: 'dots-and-boxes',
        state: boardState,
        player: 2,
        systemPrompt: DOTS_SYSTEM_PROMPT
      });
      const move = res.data.move; // { row, col, orientation }
      let valid = false;
      if (move && typeof move.row === 'number' && typeof move.col === 'number' && (move.orientation === 'h' || move.orientation === 'v')) {
        // Validate the move is not already drawn
        if (move.orientation === 'h') {
          if (!boardState.hLines[move.row][move.col]) valid = true;
        } else {
          if (!boardState.vLines[move.row][move.col]) valid = true;
        }
        if (valid) {
          handleLineClick(move.row, move.col, move.orientation, true);
        } else {
          // fallback: pick first available move
          const { hLines: hL, vLines: vL } = boardState;
          for (let r = 0; r < hL.length; r++) for (let c = 0; c < hL[0].length; c++) if (!hL[r][c]) { handleLineClick(r, c, 'h', true); setAIThinking(false); return; }
          for (let r = 0; r < vL.length; r++) for (let c = 0; c < vL[0].length; c++) if (!vL[r][c]) { handleLineClick(r, c, 'v', true); setAIThinking(false); return; }
        }
      }
    } catch (e) {
      // fallback: pick first available move
      const boardState = boardOverride || getBoardState();
      const { hLines: hL, vLines: vL } = boardState;
      for (let r = 0; r < hL.length; r++) for (let c = 0; c < hL[0].length; c++) if (!hL[r][c]) { handleLineClick(r, c, 'h', true); return; }
      for (let r = 0; r < vL.length; r++) for (let c = 0; c < vL[0].length; c++) if (!vL[r][c]) { handleLineClick(r, c, 'v', true); return; }
    }
    setAIThinking(false);
  };

  // Game over effect: check after boxes update
  React.useEffect(() => {
    if (boxes.flat().every(b => b.owner) && !gameOver) {
      setGameOver(true);
    }
  }, [boxes, gameOver]);

  // Track previous player to avoid repeated AI triggers
  const prevPlayer = React.useRef<Player>(1);

  // AI move effect: triggers only when currentPlayer changes to 2
  React.useEffect(() => {
    if (
      isVsAI &&
      !gameOver &&
      currentPlayer === 2 &&
      prevPlayer.current !== 2 &&
      !aiThinking
    ) {
      setAIThinking(true); // Set before triggering to prevent double-fire
      setTimeout(() => makeAIMove(), 600);
    }
    prevPlayer.current = currentPlayer;
    // eslint-disable-next-line
  }, [currentPlayer, isVsAI, gameOver, aiThinking]);

  // Restart
  const restart = () => {
    const state = createInitialState();
    setHLines(state.hLines);
    setVLines(state.vLines);
    setBoxes(state.boxes);
    setScores({ 1: 0, 2: 0 });
    setCurrentPlayer(1);
    setGameOver(false);
  };

  // Render
  return (
    <div className="dots-and-boxes" style={{ padding: 24, textAlign: 'center' }}>
      <h1 className="text-3xl font-bold mb-2">Dots and Boxes</h1>
      <div className="mb-4 flex justify-center gap-8">
        <button
          onClick={() => setIsVsAI(false)}
          className={`chess-btn px-4 py-2 mr-2 ${!isVsAI ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >Play vs Friend</button>
        <button
          onClick={() => setIsVsAI(true)}
          className={`chess-btn px-4 py-2 ${isVsAI ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >Play vs AI</button>
      </div>
      <div className="mb-4 flex justify-center gap-8">
        <div className="font-bold text-blue-700">Player 1: {scores[1]}</div>
        <div className="font-bold text-pink-700">Player 2: {scores[2]}</div>
      </div>
      <div className="mb-2 text-lg font-semibold">
        {gameOver ? (
          scores[1] === scores[2] ? 'It\'s a tie!' : `Winner: Player ${scores[1] > scores[2] ? 1 : 2}`
        ) : (
          <span>Current Turn: <span style={{ color: currentPlayer === 1 ? '#2563eb' : '#db2777' }}>Player {currentPlayer}</span></span>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: `repeat(${GRID_SIZE * 2 - 1}, 32px)`,
        gridTemplateColumns: `repeat(${GRID_SIZE * 2 - 1}, 32px)`,
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f1f5f9',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        margin: '0 auto',
        marginBottom: 24,
        border: '2px solid #334155',
        padding: 8,
      }}>
        {Array.from({ length: GRID_SIZE * 2 - 1 }).map((_, r) =>
          Array.from({ length: GRID_SIZE * 2 - 1 }).map((_, c) => {
            // Dots
            if (r % 2 === 0 && c % 2 === 0) {
              return <div key={`dot-${r}-${c}`} style={{ width: 16, height: 16, borderRadius: 8, background: '#334155', margin: '0 auto' }} />;
            }
            // Horizontal lines
            if (r % 2 === 0 && c % 2 === 1) {
              const row = r / 2, col = (c - 1) / 2;
              return (
                <div
                  key={`hline-${row}-${col}`}
                  onClick={() => handleLineClick(row, col, 'h')}
                  style={{
                    width: 32,
                    height: 8,
                    // Color by whether the line is drawn, not by current player
                    background: hLines[row][col] ? '#334155' : '#cbd5e1',
                    borderRadius: 4,
                    margin: '0 auto',
                    cursor: hLines[row][col] ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  aria-label={`Draw horizontal line at (${row},${col})`}
                />
              );
            }
            // Vertical lines
            if (r % 2 === 1 && c % 2 === 0) {
              const row = (r - 1) / 2, col = c / 2;
              return (
                <div
                  key={`vline-${row}-${col}`}
                  onClick={() => handleLineClick(row, col, 'v')}
                  style={{
                    width: 8,
                    height: 32,
                    // Color by whether the line is drawn, not by current player
                    background: vLines[row][col] ? '#334155' : '#cbd5e1',
                    borderRadius: 4,
                    margin: '0 auto',
                    cursor: vLines[row][col] ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  aria-label={`Draw vertical line at (${row},${col})`}
                />
              );
            }
            // Boxes
            if (r % 2 === 1 && c % 2 === 1) {
              const row = (r - 1) / 2, col = (c - 1) / 2;
              const owner = boxes[row][col].owner;
              return (
                <div
                  key={`box-${row}-${col}`}
                  style={{
                    width: 32,
                    height: 32,
                    background: owner === 1 ? '#dbeafe' : owner === 2 ? '#fbcfe8' : 'transparent',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2em',
                    color: owner === 1 ? '#2563eb' : owner === 2 ? '#db2777' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  aria-label={owner ? `Box owned by Player ${owner}` : 'Unclaimed box'}
                >
                  {owner ? (owner === 1 ? '1' : '2') : ''}
                </div>
              );
            }
            return null;
          })
        )}
      </div>
      <button
        onClick={restart}
        className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
      >
        Restart
      </button>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow mx-auto">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🎲</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Players take turns drawing lines between dots</li>
          <li>• Complete a box by drawing its fourth side</li>
          <li>• When you complete a box, you get another turn</li>
          <li>• The player with the most boxes wins!</li>
        </ul>
      </div>
    </div>
  );
};

export default DotsAndBoxes;
