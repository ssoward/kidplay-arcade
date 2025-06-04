// API Configuration for KidPlay Arcade
// Automatically detects environment and uses appropriate API URL

const getApiBaseUrl = (): string => {
  // Check for environment variable first - this takes precedence
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('Using REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // For production builds, use production URL even if served locally
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode - using production URL: http://3.144.6.45:3001');
    return 'http://3.144.6.45:3001';
  }
  
  // Development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - using localhost URL: http://localhost:3001');
    return 'http://localhost:3001';
  }
  
  // Fallback - use production URL
  console.log('Fallback - using production URL: http://3.81.165.163:3001');
  return 'http://3.81.165.163:3001';
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
