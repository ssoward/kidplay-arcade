#!/bin/bash

# Deploy Kidplay Arcade to AWS EC2
# Usage: ./deploy-to-aws.sh [EC2_IP_ADDRESS]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Kidplay Arcade to AWS EC2...${NC}"

# Default EC2 IP and key path
DEFAULT_EC2_IP="3.81.165.163"
KEY_PATH="/Users/ssoward/.ssh/kidplay-arcade-key.pem"

# Use provided IP or default
if [ -z "$1" ]; then
    EC2_IP=$DEFAULT_EC2_IP
    echo -e "${GREEN}Using default EC2 IP: $EC2_IP${NC}"
else
    EC2_IP=$1
    echo -e "${GREEN}Using provided EC2 IP: $EC2_IP${NC}"
fi

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ Key file not found at: $KEY_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}📡 Connecting to EC2 instance: $EC2_IP${NC}"

# SSH into EC2 and run deployment commands
ssh -i "$KEY_PATH" ec2-user@"$EC2_IP" << 'ENDSSH'
    echo "🔄 Pulling latest code from GitHub..."
    cd kidplay-arcade || { echo "❌ kidplay-arcade directory not found. Run: git clone https://github.com/ssoward/kidplay-arcade.git"; exit 1; }
    
    git pull origin main
    
    echo "🚀 Running deployment script..."
    chmod +x deploy-aws-ec2.sh
    ./deploy-aws-ec2.sh
    
    echo "✅ Deployment complete!"
    echo "🌐 Your Kidplay Arcade should now be available at: http://$EC2_IP"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Visit your app at: http://$EC2_IP${NC}"
    echo -e "${GREEN}🔧 SSH into your server: ssh -i $KEY_PATH ec2-user@$EC2_IP${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check the output above for errors.${NC}"
fi
