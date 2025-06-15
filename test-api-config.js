#!/usr/bin/env node

// Test API configuration in different environments
const path = require('path');
const fs = require('fs');

// Simulate different environments
const testEnvironments = [
  { NODE_ENV: 'development', REACT_APP_API_BASE_URL: undefined },
  { NODE_ENV: 'production', REACT_APP_API_BASE_URL: undefined },
  { NODE_ENV: 'production', REACT_APP_API_BASE_URL: 'http://3.81.165.163:3001' },
];

console.log('🧪 Testing API Configuration');
console.log('='.repeat(50));

testEnvironments.forEach((env, index) => {
  console.log(`\n${index + 1}. Testing environment:`, env);
  
  // Set environment variables
  Object.keys(env).forEach(key => {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  });
  
  // Clear require cache and reload the API config
  const configPath = path.resolve('./src/config/api.ts');
  delete require.cache[configPath];
  
  try {
    // Since we can't directly require TypeScript, let's manually evaluate the logic
    const getApiBaseUrl = () => {
      // Check for environment variable first
      if (process.env.REACT_APP_API_BASE_URL) {
        console.log('   Using REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
        return process.env.REACT_APP_API_BASE_URL;
      }
      
      // Check if we're in development
      if (process.env.NODE_ENV === 'development') {
        console.log('   Using development URL: http://localhost:3001');
        return 'http://localhost:3001';
      }
      
      // Production default - always include port
      console.log('   Using production URL: http://3.81.165.163:3001');
      return 'http://3.81.165.163:3001';
    };
    
    const apiUrl = getApiBaseUrl();
    console.log(`   Result: ${apiUrl}`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('✅ API Configuration Test Complete');
