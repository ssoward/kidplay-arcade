// Test script to simulate registration and see what API endpoint is called
const fetch = require('node-fetch');

const api = {
  BASE_URL: 'http://3.81.165.163:3001', // Force the correct URL
  register: async (userData) => {
    const url = `${api.BASE_URL}/api/user/register`;
    console.log('Making API call to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        return { success: true, data };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return { success: false, error: 'Invalid JSON response', responseText };
      }
    } catch (error) {
      console.error('Network error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Test registration
const testData = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  password: 'testpass123'
};

console.log('Testing registration with:', testData);
api.register(testData).then(result => {
  console.log('Result:', result);
}).catch(error => {
  console.error('Test failed:', error);
});
