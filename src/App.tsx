import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import Header from './components/Header';
import Admin from './components/Admin';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './contexts/UserContext';
import './styles/globals.css';

function App() {
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-menu]')) {
        // This will be handled by the Header component's state
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <UserProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Admin routes - separate from main app */}
            <Route path="/admin" element={<Admin />} />
            
            {/* Authentication routes */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthModal initialMode="login" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthModal initialMode="register" />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected user routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main>
                      <UserProfile />
                    </main>
                  </>
                </ProtectedRoute>
              } 
            />
            
            {/* Main app routes */}
            <Route path="*" element={
              <>
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route 
                      path="/game/:gameId" 
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <GamePage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;