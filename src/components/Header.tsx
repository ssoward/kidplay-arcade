import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header style={{
      background: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #ef4444'
    }}>
      <div className="container" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '3rem' }}>🎮</div>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#ef4444', 
                margin: 0,
                fontFamily: 'Comic Neue'
              }}>
                PlayHub
              </h1>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                Fun Games to Play
              </p>
            </div>
          </Link>
          
          {!isHomePage && (
            <Link 
              to="/" 
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              🏠 Home
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
