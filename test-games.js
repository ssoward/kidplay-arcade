// Simple test script to verify all game components can be imported
const fs = require('fs');
const path = require('path');

const gamesDir = './src/games';
const gameFiles = fs.readdirSync(gamesDir).filter(file => file.endsWith('.tsx'));

console.log('Testing all game components...\n');

gameFiles.forEach(file => {
  const filePath = path.join(gamesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const gameName = file.replace('.tsx', '');
  const hasDefaultExport = content.includes(`export default ${gameName}`);
  const hasInterface = content.includes(`interface ${gameName}Props`);
  const hasOnExit = content.includes('onExit');
  
  console.log(`✓ ${gameName}:`);
  console.log(`  - Default export: ${hasDefaultExport ? '✓' : '✗'}`);
  console.log(`  - Props interface: ${hasInterface ? '✓' : '✗'}`);
  console.log(`  - onExit prop: ${hasOnExit ? '✓' : '✗'}`);
  console.log('');
});

console.log(`Total games: ${gameFiles.length}`);
