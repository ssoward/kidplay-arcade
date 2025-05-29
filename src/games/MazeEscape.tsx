import React, { useState, useEffect, useCallback } from 'react';

const SIZE = 10;
const WALL = '#';
const PATH = ' ';
const PLAYER = 'P';
const EXIT = 'E';

function generateMaze(size: number) {
  // Simple random maze generator (DFS)
  const maze = Array.from({ length: size }, () => Array(size).fill(WALL));
  function carve(x: number, y: number) {
    maze[y][x] = PATH;
    const dirs = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 0 && ny < size && nx >= 0 && nx < size && maze[ny][nx] === WALL) {
        maze[y + dy / 2][x + dx / 2] = PATH;
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);
  maze[1][1] = PLAYER;
  maze[size - 2][size - 2] = EXIT;
  return maze;
}

const MazeEscape: React.FC = () => {
  const [maze, setMaze] = useState<string[][]>(generateMaze(SIZE));
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [won, setWon] = useState(false);

  const move = useCallback((dx: number, dy: number) => {
    if (won) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (maze[ny][nx] === WALL) return;
    if (maze[ny][nx] === EXIT) {
      setWon(true);
      return;
    }
    setPlayer({ x: nx, y: ny });
  }, [maze, player, won]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key === 'ArrowUp') move(0, -1);
      if (e.key === 'ArrowDown') move(0, 1);
      if (e.key === 'ArrowLeft') move(-1, 0);
      if (e.key === 'ArrowRight') move(1, 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move, won]);

  const reset = () => {
    setMaze(generateMaze(SIZE));
    setPlayer({ x: 1, y: 1 });
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-yellow-100 p-6">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 font-comic drop-shadow-lg">Maze Escape 🌀</h1>
        <p className="text-lg opacity-90">Find your way out of the maze! Use arrow keys.</p>
      </div>
      <div className="bg-white/80 rounded-2xl p-4 shadow-lg mb-4">
        <div style={{ fontFamily: 'monospace', lineHeight: 1.1, fontSize: '1.2rem', letterSpacing: 2 }}>
          {maze.map((row, y) => (
            <div key={y}>
              {row.map((cell, x) => {
                let display = cell;
                if (player.x === x && player.y === y) display = PLAYER;
                else if (cell === EXIT) display = EXIT;
                else if (cell === WALL) display = '█';
                else display = ' ';
                return <span key={x} style={{ width: 18, display: 'inline-block', color: cell === EXIT ? '#f59e42' : cell === WALL ? '#334155' : '#222' }}>{display}</span>;
              })}
            </div>
          ))}
        </div>
      </div>
      {won && <div className="text-2xl font-bold text-green-600 mb-2">You escaped the maze! 🎉</div>}
      <button
        onClick={reset}
        className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transform hover:scale-105"
      >New Maze</button>
      <div className="mt-8 bg-white/60 rounded-2xl p-6 max-w-md text-center shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-800">How to Play 🌀</h3>
        <ul className="text-gray-700 space-y-1 text-left">
          <li>• Use arrow keys to move</li>
          <li>• Find the exit (E) to win</li>
        </ul>
      </div>
    </div>
  );
};

export default MazeEscape;
