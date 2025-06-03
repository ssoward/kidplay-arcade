import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLogin from './UserLogin';
import UserRegistration from './UserRegistration';
import { useUser } from '../contexts/UserContext';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  initialMode = 'login',
  onClose 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { switchToGuest } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // If no onClose provided, navigate back or to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from);
    }
  };

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleGuestMode = () => {
    switchToGuest();
    handleClose();
  };

  const handleAuthSuccess = () => {
    // Redirect to the intended page or profile
    const from = (location.state as any)?.from?.pathname || '/profile';
    navigate(from);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-8 mx-auto p-6 border shadow-lg rounded-md bg-white mb-8 ${
        mode === 'register' 
          ? 'w-full max-w-2xl' // Wider for registration
          : 'w-full max-w-md'   // Standard for login
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'login' ? 'Welcome Back!' : 'Join KidPlay Arcade'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === 'login' ? (
          <UserLogin
            onClose={handleAuthSuccess}
            onSwitchToRegister={handleSwitchToRegister}
            onSwitchToGuest={handleGuestMode}
          />
        ) : (
          <UserRegistration
            onSwitchToLogin={handleSwitchToLogin}
            onClose={handleClose}
          />
        )}

        {mode === 'login' && (
          <div className="mt-6 text-center">
            <button
              onClick={handleGuestMode}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Continue as Guest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
