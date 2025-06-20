#!/bin/bash

# Quick fix for CORS issue - deploy updated .env.production

echo "🔧 Deploying CORS fix to production server..."

# Upload the updated .env.production file
scp -i "kidplay-arcade-new-key.pem" backend/.env.production ec2-user@amorvivir.com:/home/ec2-user/kidplay-arcade/backend/

# Restart the backend to pick up the new environment variables
ssh -i "kidplay-arcade-new-key.pem" ec2-user@amorvivir.com << 'EOF'
cd kidplay-arcade/backend
echo "Restarting backend with updated CORS configuration..."
pm2 restart kidplay-backend
pm2 logs kidplay-backend --lines 10
EOF

echo "✅ CORS fix deployed! Testing API endpoint..."
sleep 3

# Test the API endpoint
curl -s https://amorvivir.com/api/health && echo -e "\n✅ API is responding" || echo -e "\n❌ API still not responding"

echo "🎮 Test the TwentyQuestions game at https://amorvivir.com to verify the fix!"
