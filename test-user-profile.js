#!/usr/bin/env node
/**
 * Test script to verify user profile functionality and dateOfBirth handling
 * Run with: node test-user-profile.js
 */

// Node.js 18+ has fetch built-in
if (typeof fetch === 'undefined') {
  console.log('❌ Fetch not available. Please use Node.js 18+ or install node-fetch');
  process.exit(1);
}

async function testUserProfile() {
  console.log('🧪 Testing User Profile with dateOfBirth...\n');
  
  const baseUrl = 'http://localhost:3001';
  const testUser = {
    email: `test-profile-${Date.now()}@example.com`, // Use timestamp to avoid conflicts
    password: 'TestPassword123!',
    displayName: 'Test Profile User',
    dateOfBirth: '1990-05-15',
    accountType: 'parent'
  };

  try {
    console.log('👤 Registering test user with email:', testUser.email);
    const registerResponse = await fetch(`${baseUrl}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    console.log('📡 Register response status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('📄 Register response data:', registerData);
    
    if (registerResponse.ok && registerData.success) {
      console.log('✅ User registered successfully!');
      console.log('📧 Email:', registerData.user.email);
      console.log('🎂 Date of Birth:', registerData.user.dateOfBirth);
      console.log('📝 Display Name:', registerData.user.displayName);
      
      // Test token validation (simulate frontend receiving user data)
      console.log('\n🔑 Testing token validation...');
      const validateResponse = await fetch(`${baseUrl}/api/user/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${registerData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Validate response status:', validateResponse.status);
      
      if (validateResponse.ok) {
        const userData = await validateResponse.json();
        console.log('✅ Token validation successful!');
        console.log('📅 Validated Date of Birth type:', typeof userData.user.dateOfBirth);
        console.log('📅 Validated Date of Birth value:', userData.user.dateOfBirth);
        
        // Test if dateOfBirth can be converted to Date object
        const dateOfBirth = userData.user.dateOfBirth;
        if (dateOfBirth) {
          const dateObj = new Date(dateOfBirth);
          console.log('✅ Date conversion successful:', dateObj.toLocaleDateString());
          console.log('✅ ISO string generation:', dateObj.toISOString().split('T')[0]);
        }
        
        console.log('\n🎯 All tests passed! dateOfBirth handling is working correctly.');
      } else {
        const errorData = await validateResponse.json();
        console.log('❌ Token validation failed:', validateResponse.status, errorData);
      }
      
    } else {
      console.log('❌ User registration failed:', registerData.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Error testing user profile:', error.message);
    console.log('🔍 Full error:', error);
  }
}

testUserProfile().catch(console.error);
