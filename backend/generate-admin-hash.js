/**
 * Script to generate a bcrypt hash for the admin password
 * Run with: node generate-admin-hash.js
 * Then copy the hash to your .env file as ADMIN_PASSWORD_HASH
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Get the admin password from .env
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('❌ Error: ADMIN_PASSWORD not found in .env file');
  process.exit(1);
}

// Generate a salt and hash the password
const saltRounds = 10;
bcrypt.genSalt(saltRounds, (err, salt) => {
  if (err) {
    console.error('❌ Error generating salt:', err);
    process.exit(1);
  }

  bcrypt.hash(adminPassword, salt, (err, hash) => {
    if (err) {
      console.error('❌ Error generating hash:', err);
      process.exit(1);
    }

    console.log('✅ Bcrypt hash generated successfully!');
    console.log('-'.repeat(50));
    console.log('Hash:', hash);
    console.log('-'.repeat(50));
    console.log('\nAdd this line to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    
    // Attempt to update the .env files automatically
    const envPaths = [
      path.join(__dirname, '../.env'),
      path.join(__dirname, '.env')
    ];
    
    envPaths.forEach(envPath => {
      try {
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          
          // Check if hash already exists
          if (envContent.includes('ADMIN_PASSWORD_HASH=')) {
            envContent = envContent.replace(/ADMIN_PASSWORD_HASH=.+/g, `ADMIN_PASSWORD_HASH=${hash}`);
            console.log(`✅ Updated existing hash in ${envPath}`);
          } else {
            envContent += `\nADMIN_PASSWORD_HASH=${hash}\n`;
            console.log(`✅ Added hash to ${envPath}`);
          }
          
          fs.writeFileSync(envPath, envContent);
        }
      } catch (error) {
        console.error(`❌ Error updating ${envPath}:`, error);
        console.log('Please add the hash manually to your .env file');
      }
    });
    
    console.log('\n🔒 Security Note:');
    console.log('Although the plaintext password is still kept in the .env file');
    console.log('for backward compatibility, consider removing ADMIN_PASSWORD'); 
    console.log('after ensuring that the login works with the hash.');
  });
});
