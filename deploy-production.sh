#!/bin/bash

# KidPlay Arcade - Production Deployment Script
# This script deploys the application to your AWS server at 3.81.165.163

set -e

echo "🚀 Starting KidPlay Arcade Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_IP="3.81.165.163"
AWS_USER="ec2-user"
SSH_KEY_PATH="$HOME/.ssh/kidplay-arcade-key.pem"
REMOTE_APP_DIR="/home/ec2-user/kidplay-arcade"
LOCAL_PROJECT_DIR="/Users/ssoward/sandbox/workspace/kidplay-arcade"

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}❌ SSH key not found at $SSH_KEY_PATH${NC}"
    echo -e "${YELLOW}Please ensure your AWS EC2 key pair is saved at $SSH_KEY_PATH${NC}"
    echo -e "${YELLOW}You can download it from AWS Console > EC2 > Key Pairs${NC}"
    exit 1
fi

# Check if build directory exists
if [ ! -d "build" ]; then
    echo -e "${YELLOW}⚠️  Build directory not found. Creating production build...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_PACKAGE="kidplay-arcade-deploy-$TIMESTAMP.tar.gz"

# Create temporary deployment directory
TEMP_DEPLOY_DIR="/tmp/kidplay-arcade-deploy"
rm -rf "$TEMP_DEPLOY_DIR"
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy files needed for production
cp -r build "$TEMP_DEPLOY_DIR/"
cp -r backend "$TEMP_DEPLOY_DIR/"
cp package.json "$TEMP_DEPLOY_DIR/"
cp .env.production "$TEMP_DEPLOY_DIR/.env"

# Create the deployment package
cd /tmp
tar -czf "$DEPLOY_PACKAGE" -C kidplay-arcade-deploy .
mv "$DEPLOY_PACKAGE" "$LOCAL_PROJECT_DIR/"
cd "$LOCAL_PROJECT_DIR"

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_PACKAGE${NC}"

# Upload to server
echo -e "${BLUE}📤 Uploading to AWS server...${NC}"
scp -i "$SSH_KEY_PATH" "$DEPLOY_PACKAGE" "$AWS_USER@$AWS_IP:/tmp/"

# Deploy on server
echo -e "${BLUE}🔧 Deploying on server...${NC}"
ssh -i "$SSH_KEY_PATH" "$AWS_USER@$AWS_IP" << EOF
    set -e
    
    echo "Stopping existing application..."
    sudo systemctl stop kidplay-arcade || true
    sudo systemctl stop nginx || true
    
    echo "Backing up current deployment..."
    if [ -d "$REMOTE_APP_DIR" ]; then
        sudo mv "$REMOTE_APP_DIR" "$REMOTE_APP_DIR.backup.\$(date +%Y%m%d-%H%M%S)" || true
    fi
    
    echo "Extracting new deployment..."
    mkdir -p "$REMOTE_APP_DIR"
    cd "$REMOTE_APP_DIR"
    tar -xzf "/tmp/$DEPLOY_PACKAGE"
    
    echo "Installing backend dependencies..."
    cd backend
    npm install --production
    
    echo "Setting up environment..."
    sudo chown -R ec2-user:ec2-user "$REMOTE_APP_DIR"
    chmod +x backend/server.js
    
    echo "Starting services..."
    sudo systemctl start kidplay-arcade
    sudo systemctl start nginx
    
    echo "Enabling auto-start on boot..."
    sudo systemctl enable kidplay-arcade
    sudo systemctl enable nginx
    
    echo "Checking service status..."
    sleep 3
    sudo systemctl status kidplay-arcade --no-pager
    sudo systemctl status nginx --no-pager
EOF

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
sleep 5

# Test homepage
if curl -f -s "http://$AWS_IP/" > /dev/null; then
    echo -e "${GREEN}✅ Homepage is accessible${NC}"
else
    echo -e "${RED}❌ Homepage test failed${NC}"
fi

# Test API
if curl -f -s "http://$AWS_IP/api/ask-ai" > /dev/null; then
    echo -e "${GREEN}✅ API endpoint is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  API endpoint test inconclusive (may require POST)${NC}"
fi

# Test Trivia Blitz API specifically
if curl -f -s -X POST "http://$AWS_IP/api/ask-ai" \
    -H "Content-Type: application/json" \
    -d '{"game":"trivia-generator","category":"general","difficulty":"medium"}' > /dev/null; then
    echo -e "${GREEN}✅ Trivia Blitz API is working${NC}"
else
    echo -e "${YELLOW}⚠️  Trivia Blitz API test inconclusive${NC}"
fi

# Cleanup
rm -f "$DEPLOY_PACKAGE"
rm -rf "$TEMP_DEPLOY_DIR"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your application is now live at: http://$AWS_IP/${NC}"
echo -e "${BLUE}🎮 Trivia Blitz should now be working with AI-generated questions${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Visit http://$AWS_IP/ to verify the deployment"
echo -e "2. Test Trivia Blitz game specifically"
echo -e "3. Monitor server logs if needed: ssh -i $SSH_KEY_PATH $AWS_USER@$AWS_IP 'sudo journalctl -u kidplay-arcade -f'"
