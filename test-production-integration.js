#!/usr/bin/env node

// Complete Production Integration Test
// Tests frontend-backend integration with database authentication

const https = require('https');
const http = require('http');

const PRODUCTION_API = 'http://3.81.165.163:3001';
const TEST_EMAIL = `integration-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'IntegrationTest123!';
const TEST_DISPLAY_NAME = 'Integration Test User';

let authToken = '';
let userId = '';

const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTest = async (testName, testFunction) => {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    const result = await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    return { name: testName, status: 'PASSED', result };
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    return { name: testName, status: 'FAILED', error: error.message };
  }
};

const tests = {
  serverHealth: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/status',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
      throw new Error(`Server health check failed: ${response.statusCode}`);
    }
    if (!response.data.status || response.data.status !== 'operational') {
      throw new Error(`Server not operational: ${JSON.stringify(response.data)}`);
    }
    console.log(`   ✓ Server status: ${response.data.status}`);
    console.log(`   ✓ Environment: ${response.data.environment}`);
    console.log(`   ✓ Version: ${response.data.version}`);
    return response.data;
  },

  userRegistration: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const userData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: TEST_DISPLAY_NAME,
      accountType: 'parent'
    };

    const response = await makeRequest(options, userData);
    if (response.statusCode !== 200) {
      throw new Error(`Registration failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    if (!response.data.success) {
      throw new Error(`Registration unsuccessful: ${response.data.message}`);
    }
    
    authToken = response.data.token;
    userId = response.data.user.id;
    
    console.log(`   ✓ User registered with ID: ${userId}`);
    console.log(`   ✓ Auth token received`);
    return response.data;
  },

  userLogin: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };

    const response = await makeRequest(options, loginData);
    if (response.statusCode !== 200) {
      throw new Error(`Login failed: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    if (!response.data.success) {
      throw new Error(`Login unsuccessful: ${response.data.message}`);
    }
    
    authToken = response.data.token;
    console.log(`   ✓ Login successful`);
    console.log(`   ✓ New auth token received`);
    return response.data;
  },

  tokenValidation: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/validate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await makeRequest(options, {});
    if (response.statusCode !== 200) {
      throw new Error(`Token validation failed: ${response.statusCode}`);
    }
    if (!response.data.valid) {
      throw new Error(`Token invalid: ${response.data.message}`);
    }
    
    console.log(`   ✓ Token validated for user: ${response.data.user.email}`);
    return response.data;
  },

  getProfile: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/profile',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await makeRequest(options);
    if (response.statusCode !== 200) {
      throw new Error(`Get profile failed: ${response.statusCode}`);
    }
    if (!response.data.success) {
      throw new Error(`Get profile unsuccessful: ${response.data.message}`);
    }
    
    console.log(`   ✓ Profile retrieved for: ${response.data.user.displayName}`);
    console.log(`   ✓ Account type: ${response.data.user.accountType}`);
    return response.data;
  },

  updatePreferences: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/preferences',
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const preferences = {
      theme: 'dark',
      soundEnabled: false,
      difficulty: 'hard'
    };

    const response = await makeRequest(options, preferences);
    if (response.statusCode !== 200) {
      throw new Error(`Update preferences failed: ${response.statusCode}`);
    }
    if (!response.data.success) {
      throw new Error(`Update preferences unsuccessful: ${response.data.message}`);
    }
    
    console.log(`   ✓ Preferences updated successfully`);
    return response.data;
  },

  updateProfile: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/profile',
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const profileData = {
      displayName: 'Updated Integration Test User',
      dateOfBirth: '1990-01-01'
    };

    const response = await makeRequest(options, profileData);
    if (response.statusCode !== 200) {
      throw new Error(`Update profile failed: ${response.statusCode}`);
    }
    if (!response.data.success) {
      throw new Error(`Update profile unsuccessful: ${response.data.message}`);
    }
    
    console.log(`   ✓ Profile updated: ${response.data.user.displayName}`);
    return response.data;
  },

  forgotPassword: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/forgot-password',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const resetData = {
      email: TEST_EMAIL
    };

    const response = await makeRequest(options, resetData);
    if (response.statusCode !== 200) {
      throw new Error(`Forgot password failed: ${response.statusCode}`);
    }
    if (!response.data.success) {
      throw new Error(`Forgot password unsuccessful: ${response.data.message}`);
    }
    
    console.log(`   ✓ Password reset email would be sent`);
    return response.data;
  },

  logout: async () => {
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/user/logout',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await makeRequest(options, {});
    if (response.statusCode !== 200) {
      throw new Error(`Logout failed: ${response.statusCode}`);
    }
    if (!response.data.success) {
      throw new Error(`Logout unsuccessful: ${response.data.message}`);
    }
    
    console.log(`   ✓ Logout successful`);
    return response.data;
  }
};

const runAllTests = async () => {
  console.log('🚀 KidPlay Arcade Production Integration Tests');
  console.log('='.repeat(50));
  console.log(`📡 Testing against: ${PRODUCTION_API}`);
  console.log(`📧 Test user email: ${TEST_EMAIL}`);
  
  const results = [];
  
  // Run tests in sequence
  const testOrder = [
    'serverHealth',
    'userRegistration', 
    'userLogin',
    'tokenValidation',
    'getProfile',
    'updatePreferences',
    'updateProfile',
    'forgotPassword',
    'logout'
  ];
  
  for (const testName of testOrder) {
    const result = await runTest(testName, tests[testName]);
    results.push(result);
    
    // Short delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total:  ${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Production integration is working perfectly.');
    console.log('\n🚀 KidPlay Arcade backend is ready for full deployment!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
};

// Run the tests
runAllTests().catch(console.error);
