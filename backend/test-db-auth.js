#!/usr/bin/env node

// Database Authentication Integration Test Script
// Tests the DatabaseService integration with user authentication

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const tests = [];
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

// Register a test
function addTest(name, testFn) {
  tests.push({ name, testFn });
}

// Run tests
async function runTests() {
  logInfo('Starting database integration tests');
  logInfo(`API URL: ${API_URL}`);
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    logInfo(`Running test: ${test.name}`);
    try {
      await test.testFn();
      logSuccess(`Test passed: ${test.name}`);
      passCount++;
    } catch (error) {
      logError(`Test failed: ${test.name}`);
      logError(`  Error: ${error.message}`);
      if (error.response) {
        logError(`  Status: ${error.response.status}`);
        logError(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.request) {
        logError(`  No response received: ${error.request._currentUrl}`);
      } else {
        logError(`  Error: ${error.stack}`);
      }
      failCount++;
    }
  }
  
  console.log('\nTest Results:');
  console.log(chalk.green(`  Passed: ${passCount}`));
  console.log(chalk.red(`  Failed: ${failCount}`));
  console.log(chalk.blue(`  Total: ${tests.length}`));
  
  if (failCount > 0) {
    process.exit(1);
  }
}

// Test: User Registration
addTest('User Registration', async () => {
  const response = await axios.post(`${API_URL}/api/user/register`, testUser);
  
  if (!response.data.success || !response.data.token || !response.data.user) {
    throw new Error('Registration response format incorrect');
  }
  
  authToken = response.data.token;
  logInfo(`Registration successful for ${response.data.user.email}`);
});

// Test: User Login
addTest('User Login', async () => {
  const response = await axios.post(`${API_URL}/api/user/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  if (!response.data.success || !response.data.token || !response.data.user) {
    throw new Error('Login response format incorrect');
  }
  
  authToken = response.data.token;
  logInfo(`Login successful for ${response.data.user.email}`);
});

// Test: Token Validation
addTest('Token Validation', async () => {
  const response = await axios.post(
    `${API_URL}/api/user/validate`,
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  if (!response.data.success || !response.data.user) {
    throw new Error('Token validation response format incorrect');
  }
  
  logInfo(`Token validated for user ${response.data.user.email}`);
});

// Test: Get Profile
addTest('Get Profile', async () => {
  const response = await axios.get(
    `${API_URL}/api/user/profile`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  if (!response.data.success || !response.data.user) {
    throw new Error('Get profile response format incorrect');
  }
  
  if (response.data.user.email !== testUser.email) {
    throw new Error(`Profile email mismatch: ${response.data.user.email} != ${testUser.email}`);
  }
  
  logInfo(`Retrieved profile for ${response.data.user.email}`);
});

// Test: Update Preferences
addTest('Update Preferences', async () => {
  const preferences = {
    theme: 'dark',
    soundEnabled: false,
    difficulty: 'hard'
  };
  
  const response = await axios.put(
    `${API_URL}/api/user/preferences`,
    preferences,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  if (!response.data.success || !response.data.preferences) {
    throw new Error('Update preferences response format incorrect');
  }
  
  if (response.data.preferences.theme !== preferences.theme ||
      response.data.preferences.soundEnabled !== preferences.soundEnabled ||
      response.data.preferences.difficulty !== preferences.difficulty) {
    throw new Error('Preferences not updated correctly');
  }
  
  logInfo('Preferences updated successfully');
});

// Test: Update Profile
addTest('Update Profile', async () => {
  const profileUpdate = {
    displayName: 'Updated Test User',
    avatar: 'https://example.com/avatar.jpg'
  };
  
  const response = await axios.put(
    `${API_URL}/api/user/profile`,
    profileUpdate,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  if (!response.data.success || !response.data.user) {
    throw new Error('Update profile response format incorrect');
  }
  
  logInfo('Profile updated successfully');
});

// Test: Forgot Password
addTest('Forgot Password', async () => {
  const response = await axios.post(`${API_URL}/api/user/forgot-password`, {
    email: testUser.email
  });
  
  if (!response.data.success) {
    throw new Error('Forgot password response format incorrect');
  }
  
  logInfo('Forgot password request processed');
});

// Test: Logout
addTest('Logout', async () => {
  const response = await axios.post(
    `${API_URL}/api/user/logout`,
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  
  if (!response.data.success) {
    throw new Error('Logout response format incorrect');
  }
  
  logInfo('Logged out successfully');
});

// Run all tests
runTests();
