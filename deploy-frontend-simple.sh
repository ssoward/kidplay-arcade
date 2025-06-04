#!/bin/bash

# KidPlay Arcade - Simple Frontend Deployment via Git Pull
# This script creates a manual deployment package and instructions

set -e

echo "🚀 Creating KidPlay Arcade Frontend Deployment Package..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Creating deployment package...${NC}"

# Ensure we have the latest production build
echo -e "${YELLOW}Building production version with API fix...${NC}"
REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm run build

# Create a deployment package
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEPLOY_PACKAGE="kidplay-arcade-frontend-fix-$TIMESTAMP.tar.gz"

# Create the deployment package from build directory
tar -czf "$DEPLOY_PACKAGE" -C build .

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_PACKAGE${NC}"

# Create deployment instructions
cat > deployment-instructions.txt << EOF
KIDPLAY ARCADE - FRONTEND DEPLOYMENT INSTRUCTIONS
================================================

Package: $DEPLOY_PACKAGE
Created: $(date)

DEPLOYMENT METHOD 1: Git Pull (Recommended if available)
--------------------------------------------------------
If you have access to the server via SSH or console:

1. SSH to the server:
   ssh -i /Users/ssoward/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com

2. Navigate to the project directory:
   cd kidplay-arcade

3. Pull the latest changes:
   git pull origin main

4. Run the deployment script:
   ./deploy-aws-ec2.sh

DEPLOYMENT METHOD 2: Manual Upload
----------------------------------
If SSH is not available, upload via AWS Console or file manager:

1. Upload the package: $DEPLOY_PACKAGE

2. Extract on server:
   cd /var/www/html
   sudo rm -rf *
   sudo tar -xzf /tmp/$DEPLOY_PACKAGE
   sudo chown -R nginx:nginx /var/www/html
   sudo systemctl restart nginx

VERIFICATION STEPS:
-------------------
1. Visit: http://3.81.165.163/
2. Open browser console and check for API URL logs
3. Try user registration to test the API fix
4. Should see API calls going to: http://3.81.165.163:3001

FIXED ISSUE:
------------
✅ Frontend now correctly uses http://3.81.165.163:3001 (with port)
✅ Resolves 500 errors and JSON parsing issues during registration
✅ All API calls will now reach the correct backend server

EOF

echo -e "${GREEN}✅ Deployment instructions created: deployment-instructions.txt${NC}"
echo -e "${BLUE}🌐 Testing current frontend deployment...${NC}"

# Test current frontend
CURRENT_FRONTEND=$(curl -s "http://3.81.165.163/" | head -20)
if echo "$CURRENT_FRONTEND" | grep -q "KidPlay\|PlayHub"; then
    echo -e "${GREEN}✅ Frontend is currently accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend accessibility unclear${NC}"
fi

# Test backend
if curl -f -s "http://3.81.165.163:3001/api/status" > /dev/null; then
    echo -e "${GREEN}✅ Backend is operational and ready${NC}"
else
    echo -e "${RED}❌ Backend test failed${NC}"
fi

echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "1. Upload package to server using preferred method"
echo -e "2. Follow deployment instructions in deployment-instructions.txt"
echo -e "3. Test the API fix by trying user registration"
echo ""
echo -e "${GREEN}🎉 Frontend package ready for deployment!${NC}"
