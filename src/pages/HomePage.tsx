import React from 'react';
import { Link } from 'react-router-dom';
import { games } from '../utils/gameData';

const HomePage: React.FC = () => {
  return (
    <div className="homepage-bg">
      <div className="homepage-container">
        {/* Hero Section */}
        {/* <div className="homepage-hero">
          <h1 className="homepage-title">🎮 PlayHub</h1>
          <p className="homepage-subtitle">20 Amazing Games for Kids Ages 6-14</p>
        </div> */}

        {/* Games Grid */}
        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              className="game-link"
              tabIndex={0}
            >
              <button className="game-btn" tabIndex={-1}>
                {game.name}
              </button>
            </Link>
          ))}
        </div>

        {/* Footer Info */}
        <div className="homepage-footer">
          <div className="footer-card">
            <h2 className="footer-title">✨ Why PlayHub? ✨</h2>
            <div className="footer-features">
              <div className="feature-card">
                <div className="feature-emoji">🧠</div>
                <h3 className="feature-title">Educational</h3>
                <p className="feature-desc">Games that promote learning and critical thinking skills</p>
              </div>
              <div className="feature-card">
                <div className="feature-emoji">🔒</div>
                <h3 className="feature-title">Safe & Secure</h3>
                <p className="feature-desc">Kid-friendly content with no inappropriate material</p>
              </div>
              <div className="feature-card">
                <div className="feature-emoji">📱</div>
                <h3 className="feature-title">Responsive</h3>
                <p className="feature-desc">Works perfectly on phones, tablets, and computers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
