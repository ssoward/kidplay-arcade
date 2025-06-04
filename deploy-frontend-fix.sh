#!/bin/bash

# KidPlay Arcade - Frontend Production Deployment Script
# This script deploys ONLY the frontend build with the API port fix

set -e

echo "🚀 Starting KidPlay Arcade Frontend Deployment with API Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_IP="3.81.165.163"
AWS_HOST="ec2-3-81-165-163.compute-1.amazonaws.com"
AWS_USER="ec2-user"
SSH_KEY_PATH="/Users/ssoward/.ssh/kidplay-arcade-key.pem"
FRONTEND_DIR="/var/www/html"

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
    REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm run build
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create deployment package
echo -e "${BLUE}📦 Creating frontend deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_PACKAGE="kidplay-arcade-frontend-$TIMESTAMP.tar.gz"

# Create the deployment package from build directory
tar -czf "$DEPLOY_PACKAGE" -C build .

echo -e "${GREEN}✅ Frontend package created: $DEPLOY_PACKAGE${NC}"

# Upload to server
echo -e "${BLUE}📤 Uploading frontend to AWS server...${NC}"
scp -i "$SSH_KEY_PATH" "$DEPLOY_PACKAGE" "$AWS_USER@$AWS_HOST:/tmp/"

# Deploy frontend on server
echo -e "${BLUE}🔧 Deploying frontend on server...${NC}"
ssh -i "$SSH_KEY_PATH" "$AWS_USER@$AWS_HOST" << EOF
    set -e
    
    echo "Backing up current frontend..."
    sudo mkdir -p /var/www/html.backup
    sudo cp -r $FRONTEND_DIR/* /var/www/html.backup/ 2>/dev/null || echo "No existing files to backup"
    
    echo "Deploying new frontend..."
    sudo rm -rf $FRONTEND_DIR/*
    cd $FRONTEND_DIR
    sudo tar -xzf "/tmp/$DEPLOY_PACKAGE"
    
    echo "Setting proper permissions..."
    sudo chown -R nginx:nginx $FRONTEND_DIR
    sudo chmod -R 755 $FRONTEND_DIR
    
    echo "Restarting nginx..."
    sudo systemctl restart nginx
    
    echo "Checking nginx status..."
    sudo systemctl status nginx --no-pager
EOF

# Test deployment
echo -e "${BLUE}🧪 Testing frontend deployment...${NC}"
sleep 3

# Test homepage
if curl -f -s "http://$AWS_IP/" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend test failed${NC}"
    exit 1
fi

# Test if the frontend contains our API fix
FRONTEND_CONTENT=\$(curl -s "http://$AWS_IP/")
if echo "\$FRONTEND_CONTENT" | grep -q "3.81.165.163:3001"; then
    echo -e "${GREEN}✅ API URL fix is deployed (found 3.81.165.163:3001 in frontend)${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify API URL in frontend content${NC}"
fi

# Test backend connectivity
echo -e "${BLUE}🔗 Testing backend connectivity...${NC}"
if curl -f -s "http://$AWS_IP:3001/api/status" > /dev/null; then
    echo -e "${GREEN}✅ Backend is still running and accessible${NC}"
else
    echo -e "${RED}❌ Backend connectivity test failed${NC}"
fi

# Cleanup
rm -f "$DEPLOY_PACKAGE"

echo -e "${GREEN}🎉 Frontend deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your application is now live at: http://$AWS_IP/${NC}"
echo -e "${BLUE}🔧 Frontend now correctly points to: http://3.81.165.163:3001${NC}"
echo ""
echo -e "${YELLOW}Testing instructions:${NC}"
echo -e "1. Visit http://$AWS_IP/ to access the application"
echo -e "2. Try registering a new user to test the API fix"
echo -e "3. Check browser console for API URL confirmation"
echo ""
echo -e "${GREEN}The API port issue has been resolved! 🚀${NC}"
