// API Configuration for KidPlay Arcade
// Automatically detects environment and uses appropriate API URL

const getApiBaseUrl = (): string => {
  // Check for environment variable first - this takes precedence
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('Using REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // For production builds, use relative URLs (nginx proxy handles routing)
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode - using relative URLs with nginx proxy');
    return '';
  }
  
  // Development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - using localhost URL: http://localhost:3001');
    return 'http://localhost:3001';
  }
  
  // Fallback - use relative URLs for production
  console.log('Fallback - using relative URLs');
  return '';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/user/login',
      REGISTER: '/api/user/register',
      PROFILE: '/api/user/profile',
      LOGOUT: '/api/user/logout',
      UPDATE_PROFILE: '/api/user/profile',
      CHANGE_PASSWORD: '/api/user/change-password',
      FORGOT_PASSWORD: '/api/user/forgot-password',
      RESET_PASSWORD: '/api/user/reset-password',
      VALIDATE: '/api/user/validate',
      PREFERENCES: '/api/user/preferences'
    },
    HEALTH: '/api/health',
    GAMES: '/api/games',
    ITUNES: '/api/itunes/search'
  }
};

export default API_CONFIG;
