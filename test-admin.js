#!/usr/bin/env node
/**
 * Test script to verify admin login functionality
 * Run with: node test-admin.js
 */

// Using built-in fetch (Node.js 18+)

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login System...\n');
  
  const baseUrl = 'http://localhost:3001';
  const credentials = {
    email: 'scott.soward@gmail.com',
    password: 'Amorvivir@82'
  };

  try {
    console.log('📧 Testing admin login with credentials...');
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful!');
      console.log('🔑 Session ID:', data.sessionId);
      
      // Test metrics endpoint
      console.log('\n📊 Testing metrics endpoint...');
      const sessionToken = Buffer.from(JSON.stringify({
        email: credentials.email,
        loginTime: Date.now(),
        sessionId: data.sessionId
      })).toString('base64');
      
      const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('✅ Metrics endpoint working!');
        console.log('📈 Sample metrics:', {
          totalGameSessions: metricsData.totalGameSessions || 0,
          uniqueUsers: metricsData.uniqueUsers || 0,
          totalGames: metricsData.games?.length || 0
        });
      } else {
        console.log('❌ Metrics endpoint failed:', metricsResponse.status);
      }
      
    } else {
      console.log('❌ Admin login failed:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Error testing admin system:', error.message);
  }
}

testAdminLogin();
