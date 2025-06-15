// Test script to verify API configuration in production build
const fs = require('fs');
const path = require('path');

// Read the main JS file from the build
const buildPath = './build/static/js';
const files = fs.readdirSync(buildPath);
const mainFile = files.find(file => file.startsWith('main.') && file.endsWith('.js'));

if (mainFile) {
  const mainFilePath = path.join(buildPath, mainFile);
  const content = fs.readFileSync(mainFilePath, 'utf8');
  
  console.log('Checking for API URLs in build...');
  
  // Search for different URL patterns
  const patterns = [
    '3.81.165.163:3001',
    '3.81.165.163',
    'localhost:3001',
    'REACT_APP_API_BASE_URL'
  ];
  
  patterns.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`✓ Found: ${pattern}`);
    } else {
      console.log(`✗ Not found: ${pattern}`);
    }
  });
  
  // Search for getApiBaseUrl function
  if (content.includes('getApiBaseUrl')) {
    console.log('✓ Found: getApiBaseUrl function');
  } else {
    console.log('✗ Not found: getApiBaseUrl function');
  }
} else {
  console.log('Could not find main JS file');
}
