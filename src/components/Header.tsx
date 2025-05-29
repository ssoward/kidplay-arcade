import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Don't show header on home page
  if (isHomePage) {
    return null;
  }

  return (
    <header className="bg-gradient-to-r from-primary-600 to-secondary-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-white hover:text-accent-200 transition-colors duration-200 group"
            >
              <svg 
                className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <svg 
                className="h-6 w-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0-11l7 7v11a1 1 0 01-1 1h-3m-4-4l4-4" />
              </svg>
              <span className="font-comic font-semibold text-lg">PlayHub Arcade</span>
            </Link>
          </div>
          
          <div className="text-white/80 text-sm font-comic">
            Let's Play!
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
