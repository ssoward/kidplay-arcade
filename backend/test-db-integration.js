#!/usr/bin/env node

// Database Integration Test Script
// Tests all user authentication endpoints with the DatabaseService

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
let authToken = null;

// Test user data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'Password123!',
  displayName: 'Test User',
  accountType: 'parent'
};

// Utility functions
const logSuccess = (message) => console.log(chalk.green('✓ ' + message));
const logError = (message) => console.log(chalk.red('✗ ' + message));
const logInfo = (message) => console.log(chalk.blue('ℹ ' + message));

// Test runner
async function runTests() {
  logInfo('Starting database integration tests');
  logInfo(`API URL: ${API_URL}`);
  logInfo('Testing user authentication endpoints');
  
  try {
    // Test user registration
    await testRegistration();
    
    // Test user login
    await testLogin();
    
    // Test token validation
    await testTokenValidation();
    
    // Test get user profile
    await testGetProfile();
    
    // Test update user preferences
    await testUpdatePreferences();
    
    // Test update user profile
    await testUpdateProfile();
    
    // Test forgot password
    await testForgotPassword();
    
    // Test user logout
    await testLogout();
    
    logInfo('All tests completed successfully!');
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Individual test functions
async function testRegistration() {
  try {
    const response = await axios.post(`${API_URL}/api/user/register`, testUser);
    
    if (response.data.success && response.data.token && response.data.user) {
      logSuccess('User registration successful');
      authToken = response.data.token;
    } else {
      throw new Error('Registration response format incorrect');
    }
  } catch (error) {
    logError(`Registration failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/api/user/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.data.success && response.data.token && response.data.user) {
      logSuccess('User login successful');
      authToken = response.data.token;
    } else {
      throw new Error('Login response format incorrect');
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testTokenValidation() {
  try {
    const response = await axios.post(
      `${API_URL}/api/user/validate`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.user) {
      logSuccess('Token validation successful');
    } else {
      throw new Error('Token validation response format incorrect');
    }
  } catch (error) {
    logError(`Token validation failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testGetProfile() {
  try {
    const response = await axios.get(
      `${API_URL}/api/user/profile`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.user) {
      logSuccess('Get profile successful');
      
      // Verify profile data
      const user = response.data.user;
      if (user.email !== testUser.email || user.displayName !== testUser.displayName) {
        throw new Error('Profile data does not match');
      }
    } else {
      throw new Error('Get profile response format incorrect');
    }
  } catch (error) {
    logError(`Get profile failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testUpdatePreferences() {
  try {
    const newPreferences = {
      theme: 'dark',
      soundEnabled: false,
      difficulty: 'hard'
    };
    
    const response = await axios.put(
      `${API_URL}/api/user/preferences`,
      newPreferences,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.preferences) {
      logSuccess('Update preferences successful');
      
      // Verify preferences were updated
      const { preferences } = response.data;
      if (preferences.theme !== newPreferences.theme ||
          preferences.soundEnabled !== newPreferences.soundEnabled ||
          preferences.difficulty !== newPreferences.difficulty) {
        throw new Error('Preferences not updated correctly');
      }
    } else {
      throw new Error('Update preferences response format incorrect');
    }
  } catch (error) {
    logError(`Update preferences failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testUpdateProfile() {
  try {
    const profileUpdates = {
      displayName: 'Updated Test User',
      avatar: 'https://example.com/avatar.jpg'
    };
    
    const response = await axios.put(
      `${API_URL}/api/user/profile`,
      profileUpdates,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success && response.data.user) {
      logSuccess('Update profile successful');
      
      // Verify profile was updated
      const user = response.data.user;
      if (user.displayName !== profileUpdates.displayName ||
          user.avatar !== profileUpdates.avatar) {
        throw new Error('Profile not updated correctly');
      }
    } else {
      throw new Error('Update profile response format incorrect');
    }
  } catch (error) {
    logError(`Update profile failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testForgotPassword() {
  try {
    const response = await axios.post(`${API_URL}/api/user/forgot-password`, {
      email: testUser.email
    });
    
    if (response.data.success) {
      logSuccess('Forgot password successful');
    } else {
      throw new Error('Forgot password response format incorrect');
    }
  } catch (error) {
    logError(`Forgot password failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testLogout() {
  try {
    const response = await axios.post(
      `${API_URL}/api/user/logout`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      logSuccess('Logout successful');
      
      // Verify token is now invalid by attempting to validate it
      try {
        await axios.post(
          `${API_URL}/api/user/validate`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        logError('Token should be invalid after logout');
        throw new Error('Token still valid after logout');
      } catch (validationError) {
        if (validationError.response && validationError.response.status === 401) {
          logSuccess('Token correctly invalidated after logout');
        } else {
          throw validationError;
        }
      }
    } else {
      throw new Error('Logout response format incorrect');
    }
  } catch (error) {
    logError(`Logout failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Run the tests
runTests();
