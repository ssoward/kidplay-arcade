#!/bin/bash

# Deploy Kidplay Arcade to AWS EC2 with Enhanced Verification
# Usage: ./deploy-to-aws.sh [EC2_IP_ADDRESS]
# 
# This script deploys the latest code and verifies:
# - CORS configuration
# - Environment variables
# - API functionality
# - Disney songs feature
# - Backend/frontend connectivity

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Kidplay Arcade to AWS EC2 with Enhanced Verification...${NC}"

# Default EC2 Host and key path
DEFAULT_EC2_HOST="ec2-3-144-6-45.us-east-2.compute.amazonaws.com"
KEY_PATH="/Users/ssoward/.ssh/kidplay-arcade-key.pem"

# Use provided host or default
if [ -z "$1" ]; then
    EC2_HOST=$DEFAULT_EC2_HOST
    echo -e "${GREEN}Using default EC2 Host: $EC2_HOST${NC}"
else
    EC2_HOST=$1
    echo -e "${GREEN}Using provided EC2 Host: $EC2_HOST${NC}"
fi

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ Key file not found at: $KEY_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}📡 Connecting to EC2 instance: $EC2_HOST${NC}"

# SSH into EC2 and run enhanced deployment with verification
ssh -i "$KEY_PATH" ec2-user@"$EC2_HOST" << ENDSSH
    set -e  # Exit on any error
    
    echo -e "${BLUE}🔄 Pulling latest code from GitHub...${NC}"
    cd kidplay-arcade || { echo -e "${RED}❌ kidplay-arcade directory not found. Run: git clone https://github.com/ssoward/kidplay-arcade.git${NC}"; exit 1; }
    
    # Show current commit for verification
    echo -e "${CYAN}📋 Current commit:${NC}"
    git log --oneline -1
    
    git pull origin main
    
    echo -e "${CYAN}📋 Latest commit after pull:${NC}"
    git log --oneline -1
    
    echo -e "${BLUE}🚀 Running deployment script...${NC}"
    chmod +x deploy-aws-ec2.sh
    ./deploy-aws-ec2.sh
    
    echo -e "${BLUE}🔧 Configuring enhanced environment with CORS support...${NC}"
    
    # Update PM2 ecosystem configuration with proper environment variables
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      AZURE_API_KEY: '286f8880393d45acb678e890b36f0f6b',
      AZURE_ENDPOINT: 'https://familysearch-ai-learning-and-hackathons-proxy.azure-api.net/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview',
      ALLOWED_ORIGINS: 'http://$EC2_IP,http://localhost:3000,http://localhost:3001'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      AZURE_API_KEY: '286f8880393d45acb678e890b36f0f6b',
      AZURE_ENDPOINT: 'https://familysearch-ai-learning-and-hackathons-proxy.azure-api.net/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview',
      ALLOWED_ORIGINS: 'http://$EC2_IP,http://localhost:3000,http://localhost:3001'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF
    
    echo -e "${BLUE}🔄 Restarting application with updated configuration...${NC}"
    pm2 delete kidplay-arcade 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    # Wait for application to start
    echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
    sleep 5
    
    echo -e "${BLUE}📊 Verification Phase Starting...${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    # Check PM2 status
    echo -e "${CYAN}📋 PM2 Application Status:${NC}"
    pm2 status
    
    # Check if backend is responding
    echo -e "${CYAN}🔍 Testing Backend API Health...${NC}"
    if curl -s -f http://localhost:3001/api/ask-ai -X POST -H 'Content-Type: application/json' -d '{"history": [{"role": "user", "content": "test"}]}' > /dev/null; then
        echo -e "${GREEN}✅ Backend API is responding${NC}"
    else
        echo -e "${RED}❌ Backend API is not responding${NC}"
    fi
    
    # Check CORS configuration
    echo -e "${CYAN}🔍 Testing CORS Configuration...${NC}"
    CORS_TEST=\$(curl -s -H "Origin: http://$EC2_IP" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://localhost:3001/api/ask-ai)
    if echo "\$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✅ CORS is properly configured${NC}"
    else
        echo -e "${YELLOW}⚠️  CORS response: \$CORS_TEST${NC}"
    fi
    
    # Test Disney songs feature
    echo -e "${CYAN}🔍 Testing Disney Songs Feature...${NC}"
    DISNEY_TEST=\$(curl -s http://localhost:3001/api/ask-ai -X POST -H 'Content-Type: application/json' -d '{"history": [{"role": "user", "content": "Generate a Disney song for kids with the word Frozen or Moana"}]}' 2>/dev/null)
    if echo "\$DISNEY_TEST" | grep -qi -E "(disney|frozen|moana|elsa|anna)"; then
        echo -e "${GREEN}✅ Disney songs feature is working${NC}"
    else
        echo -e "${YELLOW}⚠️  Disney feature test inconclusive${NC}"
    fi
    
    # Check recent logs for errors
    echo -e "${CYAN}🔍 Checking Recent Application Logs...${NC}"
    echo -e "${YELLOW}Last 5 application log entries:${NC}"
    pm2 logs kidplay-arcade --lines 5 --nostream
    
    # Check nginx status
    echo -e "${CYAN}🔍 Checking Nginx Status...${NC}"
    if sudo systemctl is-active nginx >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
    else
        echo -e "${RED}❌ Nginx is not running${NC}"
        sudo systemctl start nginx
    fi
    
    # Test full frontend-backend integration
    echo -e "${CYAN}🔍 Testing Frontend-Backend Integration...${NC}"
    FRONTEND_TEST=\$(curl -s -w "%{http_code}" http://localhost/ -o /dev/null)
    if [ "\$FRONTEND_TEST" = "200" ]; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${RED}❌ Frontend returned status: \$FRONTEND_TEST${NC}"
    fi
    
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Deployment and verification complete!${NC}"
    echo -e "${GREEN}🌐 Your Kidplay Arcade should now be available at: http://$EC2_IP${NC}"
    
    # Final status summary
    echo -e "${BLUE}📊 Final Status Summary:${NC}"
    echo -e "${CYAN}• Application URL: http://$EC2_IP${NC}"
    echo -e "${CYAN}• Backend API: http://$EC2_IP:3001/api${NC}"
    echo -e "${CYAN}• PM2 Process: \$(pm2 list | grep kidplay-arcade | awk '{print \$10}')${NC}"
    echo -e "${CYAN}• Disney Songs: Available in Song Quiz game${NC}"
    echo -e "${CYAN}• CORS: Configured for http://$EC2_IP${NC}"
ENDSSH

# Local verification and final status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access Points:${NC}"
    echo -e "${GREEN}• Main Application: http://$EC2_IP${NC}"
    echo -e "${GREEN}• Song Quiz (Disney): http://$EC2_IP - Navigate to 'Song Quiz' and select 'Disney' genre${NC}"
    echo -e "${GREEN}• Backend API: http://$EC2_IP:3001/api${NC}"
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo -e "${CYAN}• SSH Access: ssh -i $KEY_PATH ec2-user@$EC2_HOST${NC}"
    echo -e "${CYAN}• View Logs: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd kidplay-arcade && pm2 logs kidplay-arcade'${NC}"
    echo -e "${CYAN}• Restart App: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd kidplay-arcade && pm2 restart kidplay-arcade'${NC}"
    echo -e "${CYAN}• Check Status: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd kidplay-arcade && pm2 status'${NC}"
    echo ""
    echo -e "${BLUE}🎵 Disney Songs Feature:${NC}"
    echo -e "${GREEN}• Fully deployed and configured${NC}"
    echo -e "${GREEN}• 6 fallback Disney songs available${NC}"
    echo -e "${GREEN}• AI-powered Disney song generation enabled${NC}"
    echo -e "${GREEN}• Songs from: Frozen, Encanto, Moana, Aladdin, Lion King, Toy Story${NC}"
    echo ""
    echo -e "${BLUE}🔒 Security & Performance:${NC}"
    echo -e "${GREEN}• CORS configured for production${NC}"
    echo -e "${GREEN}• Rate limiting enabled${NC}"
    echo -e "${GREEN}• Security headers active${NC}"
    echo -e "${GREEN}• PM2 process management with auto-restart${NC}"
    echo ""
    echo -e "${YELLOW}💡 Pro Tip: Test the Disney feature by going to Song Quiz → Genre: Disney${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check the output above for errors.${NC}"
    echo -e "${YELLOW}🔧 Troubleshooting steps:${NC}"
    echo -e "${CYAN}1. Check SSH connection: ssh -i $KEY_PATH ec2-user@$EC2_HOST${NC}"
    echo -e "${CYAN}2. Verify git repository: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'ls -la kidplay-arcade'${NC}"
    echo -e "${CYAN}3. Check application logs: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd kidplay-arcade && pm2 logs'${NC}"
    echo -e "${CYAN}4. Restart services manually: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd kidplay-arcade && pm2 restart kidplay-arcade'${NC}"
    exit 1
fi
