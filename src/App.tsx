import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import Header from './components/Header';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;