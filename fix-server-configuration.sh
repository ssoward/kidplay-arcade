#!/bin/bash

# Fix KidPlay Arcade Server Configuration
# This script checks and fixes the PM2 configuration to use the database-backed server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_HOST="ec2-3-81-165-163.compute-1.amazonaws.com"
SSH_KEY="~/.ssh/kidplay-arcade-key.pem"

echo -e "${BLUE}🔧 Fixing KidPlay Arcade Server Configuration${NC}"
echo "Server IP: $SERVER_IP"
echo ""

# Test current server response
echo -e "${YELLOW}🔍 Testing current server configuration...${NC}"
RESPONSE=$(curl -s "http://$SERVER_IP:3001/api/health" || echo "NO_RESPONSE")

if echo "$RESPONSE" | grep -q "OK"; then
    echo -e "${GREEN}✅ Database server is already running correctly!${NC}"
    exit 0
elif echo "$RESPONSE" | grep -q "Cannot GET"; then
    echo -e "${YELLOW}⚠️  Server is running but using wrong configuration${NC}"
    echo "   Current response: $RESPONSE"
    echo "   Need to switch to database-backed server"
else
    echo -e "${RED}❌ Server is not responding correctly${NC}"
    echo "   Response: $RESPONSE"
fi

echo ""
echo -e "${YELLOW}🚀 Connecting to AWS server to fix configuration...${NC}"

# SSH commands to fix the server
SSH_COMMANDS='
echo "🔍 Checking current PM2 status..."
pm2 list

echo ""
echo "📋 Checking ecosystem configuration..."
cat ~/kidplay-arcade/ecosystem.config.js

echo ""
echo "🔄 Stopping current PM2 process..."
pm2 stop all || true
pm2 delete all || true

echo ""
echo "📁 Checking available server files..."
ls -la ~/kidplay-arcade/backend/server*.js

echo ""
echo "🚀 Starting database-backed server..."
cd ~/kidplay-arcade
pm2 start ecosystem.config.js --env production

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "🔍 Checking new PM2 status..."
pm2 list

echo ""
echo "📝 Checking recent logs..."
pm2 logs --lines 10
'

# Check if SSH key exists
if [ ! -f ~/.ssh/kidplay-arcade-key.pem ]; then
    echo -e "${RED}❌ SSH key not found at ~/.ssh/kidplay-arcade-key.pem${NC}"
    echo "Please ensure the SSH key is available or update the path"
    exit 1
fi

# Set proper permissions on SSH key
chmod 400 ~/.ssh/kidplay-arcade-key.pem

# Connect and execute commands
echo "Executing server configuration fix..."
ssh -i ~/.ssh/kidplay-arcade-key.pem ubuntu@$SERVER_HOST "$SSH_COMMANDS"

echo ""
echo -e "${YELLOW}⏳ Waiting for server to restart...${NC}"
sleep 5

# Test the fixed server
echo -e "${YELLOW}🧪 Testing fixed server configuration...${NC}"
NEW_RESPONSE=$(curl -s "http://$SERVER_IP:3001/api/health" || echo "NO_RESPONSE")

if echo "$NEW_RESPONSE" | grep -q "OK"; then
    echo -e "${GREEN}✅ SUCCESS! Database server is now running correctly${NC}"
    echo "   Response: $NEW_RESPONSE"
    echo ""
    echo -e "${GREEN}🎉 KidPlay Arcade is ready for production use!${NC}"
    echo "   Health endpoint: http://$SERVER_IP:3001/api/health"
    echo "   Auth endpoints: http://$SERVER_IP:3001/api/auth/*"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Run: ./test-production-server.sh"
    echo "   2. Test frontend: npm run start:prod"
else
    echo -e "${RED}❌ Server still not responding correctly${NC}"
    echo "   Response: $NEW_RESPONSE"
    echo ""
    echo "🔍 Manual debugging needed. Check server logs with:"
    echo "   ssh -i ~/.ssh/kidplay-arcade-key.pem ubuntu@$SERVER_HOST 'pm2 logs kidplay-arcade'"
fi
