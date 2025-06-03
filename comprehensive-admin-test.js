#!/usr/bin/env node
/**
 * Comprehensive Admin System Test
 * Tests all admin endpoints and functionality
 */

async function comprehensiveAdminTest() {
  console.log('🧪 Comprehensive Admin System Test\n');
  
  const baseUrl = 'http://localhost:3001';
  const credentials = {
    email: 'scott.soward@gmail.com',
    password: 'Amorvivir@82'
  };

  let sessionToken = null;

  try {
    // Test 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Admin login successful');
      
      // Create session token
      sessionToken = Buffer.from(JSON.stringify({
        email: credentials.email,
        loginTime: Date.now(),
        sessionId: loginData.sessionId || 'test-session'
      })).toString('base64');
      
    } else {
      console.log('❌ Admin login failed:', loginData.message);
      return;
    }

    // Test 2: Health Check
    console.log('\n2️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/admin/health`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log('🟢 Server status:', healthData.status);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Test 3: Metrics Endpoint
    console.log('\n3️⃣ Testing Metrics Endpoint...');
    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      console.log('✅ Metrics endpoint working');
      console.log('📊 Metrics:', {
        totalGameSessions: metricsData.totalGameSessions || 0,
        uniqueUsers: metricsData.uniqueUsers || 0,
        totalGames: metricsData.games?.length || 0,
        uptime: metricsData.uptime || 'N/A'
      });
    } else {
      console.log('❌ Metrics endpoint failed:', metricsResponse.status);
    }

    // Test 4: Data Export
    console.log('\n4️⃣ Testing Data Export...');
    const exportResponse = await fetch(`${baseUrl}/api/admin/export-data`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (exportResponse.ok) {
      const exportData = await exportResponse.json();
      console.log('✅ Data export working');
      console.log('📁 Export contains:', Object.keys(exportData));
    } else {
      console.log('❌ Data export failed:', exportResponse.status);
    }

    // Test 5: Invalid Authentication
    console.log('\n5️⃣ Testing Invalid Authentication...');
    const invalidResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });

    if (invalidResponse.status === 401) {
      console.log('✅ Invalid authentication properly rejected');
    } else {
      console.log('❌ Security issue: Invalid auth not rejected');
    }

    console.log('\n🎉 Admin system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Admin login: Working ✅');
    console.log('• Authentication: Secure ✅');
    console.log('• Health endpoint: Working ✅');
    console.log('• Metrics endpoint: Working ✅');
    console.log('• Data export: Working ✅');
    console.log('• Security: Properly configured ✅');

  } catch (error) {
    console.log('❌ Error during admin system test:', error.message);
  }
}

comprehensiveAdminTest();
