import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

interface UserLoginProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToGuest?: () => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ 
  onClose, 
  onSwitchToRegister, 
  onSwitchToGuest 
}) => {
  const { login, switchToGuest, isLoading } = useUser();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(credentials.email, credentials.password);
    
    if (success) {
      onClose?.();
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleGuestMode = () => {
    switchToGuest();
    onSwitchToGuest?.();
    onClose?.();
  };

  const handleForgotPassword = async () => {
    if (!credentials.email) {
      setError('Please enter your email address first');
      return;
    }
    
    try {
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email })
      });
      
      if (response.ok) {
        setShowForgotPassword(true);
      } else {
        setError('Email not found or password reset failed');
      }
    } catch (error) {
      setError('Failed to send password reset email');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-green-100 rounded-full">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a password reset link to {credentials.email}
          </p>
          <button
            onClick={() => setShowForgotPassword(false)}
            className="mt-4 text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Login Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={credentials.email}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={credentials.password}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {onSwitchToRegister && (
            <button
              onClick={onSwitchToRegister}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Create New Account
            </button>
          )}
          
          <button
            onClick={handleGuestMode}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
