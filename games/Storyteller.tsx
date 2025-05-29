import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Storyteller.css';
// import './Chess.css';

const GENRES = [
  'Any',
  'Adventure',
  'Mystery',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Spooky',
  'Fairy Tale',
  'Superhero',
];

const SYSTEM_PROMPT = (genre: string) =>
  `You are a creative AI storyteller. You and the user will take turns writing a story, one or two sentences at a time. Respond with only your next part of the story, not instructions. Continue the story in the chosen genre: ${genre}. Keep it fun, imaginative, and age-appropriate. Do not end the story unless the user asks you to.`;

const Storyteller: React.FC = () => {
  const [genre, setGenre] = useState('Any');
  const [story, setStory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState('');
  const storyEndRef = useRef<HTMLDivElement>(null);

  const startStory = async () => {
    setStory([]);
    setInput('');
    setGameStarted(true);
    setError('');
    setAiThinking(true);
    try {
      const history = [
        { role: 'system', content: SYSTEM_PROMPT(genre) },
        { role: 'user', content: 'Let\'s start a story!' },
      ];
      const res = await axios.post('/api/ask-ai', { history });
      setStory([res.data.message]);
    } catch (e) {
      setError('Sorry, the AI could not start the story.');
    } finally {
      setAiThinking(false);
    }
  };

  const addToStory = async () => {
    if (!input.trim()) return;
    setError('');
    setAiThinking(true);
    const newStory = [...story, input];
    setStory(newStory);
    setInput('');
    try {
      const history = [
        { role: 'system', content: SYSTEM_PROMPT(genre) },
        { role: 'user', content: 'Let\'s start a story!' },
        ...newStory.map((line, i) =>
          i % 2 === 0
            ? { role: 'assistant', content: line }
            : { role: 'user', content: line }
        ),
      ];
      const res = await axios.post('/api/ask-ai', { history });
      setStory([...newStory, res.data.message]);
    } catch (e) {
      setError('Sorry, the AI could not continue the story.');
    } finally {
      setAiThinking(false);
      setTimeout(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const endStory = async () => {
    setError('');
    setAiThinking(true);
    try {
      const history = [
        { role: 'system', content: SYSTEM_PROMPT(genre) },
        { role: 'user', content: 'Let\'s start a story!' },
        ...story.map((line, i) =>
          i % 2 === 0
            ? { role: 'assistant', content: line }
            : { role: 'user', content: line }
        ),
        { role: 'user', content: 'Please end the story.' },
      ];
      const res = await axios.post('/api/ask-ai', { history });
      setStory([...story, res.data.message]);
    } catch (e) {
      setError('Sorry, the AI could not end the story.');
    } finally {
      setAiThinking(false);
      setTimeout(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const reset = () => {
    setGenre('Any');
    setStory([]);
    setInput('');
    setGameStarted(false);
    setError('');
    setAiThinking(false);
  };

  return (
    <div className="storyteller-container min-h-screen flex flex-col items-center bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 p-4 md:p-8">
      <div className="storyteller-header w-full max-w-2xl flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="game-title text-3xl md:text-4xl font-bold font-comic drop-shadow-lg text-center md:text-left mb-4 md:mb-0">AI Storyteller</h1>
        <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={reset} disabled={aiThinking}>
          New Story
        </button>
      </div>
      {!gameStarted && (
        <div className="setup-panel bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center w-full max-w-lg">
          <h2 className="mb-2 text-xl font-bold">Choose a Genre</h2>
          <select
            className="genre-select mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-lg"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={aiThinking}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2" onClick={startStory} disabled={aiThinking}>
            Start Story
          </button>
        </div>
      )}
      {gameStarted && (
        <div className="story-panel w-full max-w-2xl flex flex-col items-center">
          <div className="story-display bg-white/90 rounded-xl shadow-lg p-6 w-full mb-4 min-h-[200px] max-h-[50vh] overflow-y-auto">
            {story.length === 0 && <div className="story-placeholder text-gray-400 text-lg text-center">The story will appear here...</div>}
            {story.map((line, i) => (
              <div
                key={i}
                className={
                  i % 2 === 0
                    ? 'story-ai-line flex items-start mb-2'
                    : 'story-user-line flex items-start mb-2 justify-end'
                }
              >
                <span className={i % 2 === 0 ? 'mr-2 font-bold text-pink-600' : 'mr-2 font-bold text-blue-600'}>{i % 2 === 0 ? 'AI:' : 'You:'}</span>
                <span className="inline-block bg-yellow-50 px-3 py-2 rounded-xl shadow text-gray-800 max-w-[80%] break-words">{line}</span>
              </div>
            ))}
            <div ref={storyEndRef} />
          </div>
          {error && <div className="error-message text-red-600 font-semibold mb-2">{error}</div>}
          {!aiThinking && (
            <div className="input-panel w-full flex flex-col md:flex-row gap-2 items-center">
              <textarea
                className="story-input flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg resize-none mb-2 md:mb-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your turn! Add a sentence or two..."
                rows={2}
                disabled={aiThinking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addToStory();
                  }
                }}
              />
              <button
                className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
                onClick={addToStory}
                disabled={aiThinking || !input.trim()}
              >
                Continue
              </button>
              <button
                className="chess-btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 mt-2 ml-2"
                onClick={endStory}
                disabled={aiThinking || story.length < 4}
              >
                End Story
              </button>
            </div>
          )}
          {aiThinking && <div className="ai-thinking text-lg text-gray-500 mt-2">AI is thinking...</div>}
        </div>
      )}
    </div>
  );
};

export default Storyteller;
