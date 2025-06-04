// Simple Production Test
const http = require('http');

const TEST_EMAIL = `simple-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

console.log('🧪 Simple Production Test Starting...');

// Test 1: Server Health
const testHealth = () => {
  return new Promise((resolve, reject) => {
    console.log('\n1️⃣ Testing server health...');
    const options = {
      hostname: '3.81.165.163',
      port: 3001,
      path: '/api/status',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          console.log(`✅ Health Check: ${parsed.status}`);
          resolve(parsed);
        } else {
          reject(new Error(`Health check failed: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

// Test 2: User Registration
const testRegistration = () => {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣ Testing user registration...');
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
      displayName: 'Simple Test User',
      accountType: 'parent'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log(`✅ Registration: User ${parsed.user.email} created`);
            resolve(parsed);
          } else {
            reject(new Error(`Registration failed: ${parsed.message}`));
          }
        } else {
          reject(new Error(`Registration failed: ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(userData));
    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    await testHealth();
    await testRegistration();
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
};

runTests();
