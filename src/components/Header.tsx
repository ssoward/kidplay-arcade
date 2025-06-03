import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, isGuest, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'child':
        return '👶';
      case 'parent':
        return '👨‍👩‍👧‍👦';
      case 'educator':
        return '👩‍🏫';
      default:
        return '👤';
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-300 group bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20"
            >
              <svg 
                className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">🎮</div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                KidPlay Arcade
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User Authentication Section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white hover:text-purple-300 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 hover:bg-white/20"
                >
                  <div className="text-lg">{user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span>{getAccountTypeIcon(user.accountType)}</span>
                  )}</div>
                  <span className="font-medium">{user.displayName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user.accountType} account
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : isGuest ? (
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">Guest Mode</span>
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-white hover:text-purple-300 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <div className="hidden sm:block text-white/80 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <span className="text-yellow-300">✨</span> Let's Play & Learn!
            </div>
            
            {/* Fun decorative elements */}
            <div className="hidden md:flex space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"></div>
    </header>
  );
};

export default Header;
