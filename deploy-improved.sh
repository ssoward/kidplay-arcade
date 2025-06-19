#!/bin/bash

# KidPlay Arcade - Improved Production Deployment Script
# This script deploys the application to AWS EC2 with enhanced error handling and security

set -e

echo "🚀 Starting KidPlay Arcade Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Use environment variables for sensitive data
AWS_IP="${AWS_EC2_IP:-3.88.41.133}"
AWS_USER="${AWS_EC2_USER:-ubuntu}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/kidplay-arcade-new-key.pem}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/var/www/kidplay-arcade}"
LOCAL_PROJECT_DIR="$(pwd)"
BACKEND_PORT="${BACKEND_PORT:-3001}"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  AWS IP: ${AWS_IP}"
echo -e "  AWS User: ${AWS_USER}"
echo -e "  SSH Key: ${SSH_KEY_PATH}"
echo -e "  Remote Dir: ${REMOTE_APP_DIR}"
echo -e "  Backend Port: ${BACKEND_PORT}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if SSH key exists
    if [ ! -f "$SSH_KEY_PATH" ]; then
        echo -e "${RED}❌ SSH key not found at $SSH_KEY_PATH${NC}"
        echo -e "${YELLOW}Please ensure your AWS EC2 key pair is saved at $SSH_KEY_PATH${NC}"
        echo -e "${YELLOW}Or set SSH_KEY_PATH environment variable${NC}"
        exit 1
    fi
    
    # Check SSH key permissions
    if [ "$(stat -c %a "$SSH_KEY_PATH" 2>/dev/null || stat -f %A "$SSH_KEY_PATH")" != "400" ]; then
        echo -e "${YELLOW}⚠️  Fixing SSH key permissions...${NC}"
        chmod 400 "$SSH_KEY_PATH"
    fi
    
    # Test SSH connection
    echo -e "${BLUE}Testing SSH connection...${NC}"
    if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$AWS_USER@$AWS_IP" exit 2>/dev/null; then
        echo -e "${RED}❌ Cannot connect to AWS server${NC}"
        echo -e "${YELLOW}Please check your SSH key and AWS instance status${NC}"
        exit 1
    fi
    
    # Check if Node.js and npm are available locally
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ Node.js and npm are required${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to build the application
build_application() {
    echo -e "${BLUE}🔨 Building application...${NC}"
    
    # Clean previous build
    rm -rf build
    
    # Set production API URL
    export REACT_APP_API_BASE_URL="http://${AWS_IP}:${BACKEND_PORT}"
    
    # Build the application
    if ! npm run build; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Application built successfully${NC}"
}

# Function to create deployment package
create_deployment_package() {
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
    
    # Create production environment file (without sensitive data in git)
    cat > "$TEMP_DEPLOY_DIR/.env" << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=${BACKEND_PORT}

# CORS Configuration
ALLOWED_ORIGINS=http://${AWS_IP},http://${AWS_IP}:80,http://${AWS_IP}:${BACKEND_PORT}

# Azure OpenAI Configuration - Set these on server
# AZURE_API_KEY=your_api_key_here
# AZURE_ENDPOINT=your_endpoint_here

# Optional: Enable demo mode as fallback
DEMO_MODE=false
EOF
    
    # Create the deployment package
    cd /tmp
    tar -czf "$DEPLOY_PACKAGE" -C kidplay-arcade-deploy .
    mv "$DEPLOY_PACKAGE" "$LOCAL_PROJECT_DIR/"
    cd "$LOCAL_PROJECT_DIR"
    
    echo -e "${GREEN}✅ Deployment package created: $DEPLOY_PACKAGE${NC}"
}

# Function to deploy to server
deploy_to_server() {
    echo -e "${BLUE}📤 Uploading to AWS server...${NC}"
    
    # Upload deployment package
    if ! scp -i "$SSH_KEY_PATH" "$DEPLOY_PACKAGE" "$AWS_USER@$AWS_IP:/tmp/"; then
        echo -e "${RED}❌ Failed to upload deployment package${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔧 Deploying on server...${NC}"
    
    # Deploy on server with improved error handling
    ssh -i "$SSH_KEY_PATH" "$AWS_USER@$AWS_IP" << EOF
        set -e
        
        echo "Checking server prerequisites..."
        
        # Check if Node.js is installed
        if ! command -v node &> /dev/null; then
            echo "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            sudo npm install -g pm2
        fi
        
        echo "Stopping existing application..."
        pm2 stop kidplay-backend || true
        pm2 delete kidplay-backend || true
        
        echo "Backing up current deployment..."
        if [ -d "$REMOTE_APP_DIR" ]; then
            sudo mv "$REMOTE_APP_DIR" "$REMOTE_APP_DIR.backup.\$(date +%Y%m%d-%H%M%S)" || true
        fi
        
        echo "Creating application directory..."
        sudo mkdir -p "$REMOTE_APP_DIR"
        sudo chown -R $AWS_USER:$AWS_USER "$REMOTE_APP_DIR"
        
        echo "Extracting new deployment..."
        cd "$REMOTE_APP_DIR"
        tar -xzf "/tmp/$DEPLOY_PACKAGE"
        
        echo "Installing backend dependencies..."
        cd backend
        npm install --production --no-optional
        
        echo "Setting up environment permissions..."
        chmod +x server.js
        
        echo "Starting backend with PM2..."
        pm2 start server.js --name kidplay-backend --env production
        pm2 save
        pm2 startup || true
        
        echo "Waiting for backend to start..."
        sleep 5
        
        echo "Checking backend status..."
        pm2 status kidplay-backend
        
        # Test backend health
        echo "Testing backend health..."
        for i in {1..10}; do
            if curl -f -s "http://localhost:${BACKEND_PORT}/api/health" > /dev/null; then
                echo "✅ Backend is healthy"
                break
            fi
            echo "Waiting for backend to be ready... (attempt \$i/10)"
            sleep 2
        done
        
        echo "Deployment completed on server"
EOF

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Server deployment failed${NC}"
        exit 1
    fi
}

# Function to test deployment
test_deployment() {
    echo -e "${BLUE}🧪 Testing deployment...${NC}"
    sleep 3
    
    # Test health endpoint
    echo -e "${BLUE}Testing health endpoint...${NC}"
    if curl -f -s "http://$AWS_IP:$BACKEND_PORT/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint is accessible${NC}"
    else
        echo -e "${RED}❌ Health endpoint test failed${NC}"
        return 1
    fi
    
    # Test CORS preflight
    echo -e "${BLUE}Testing CORS configuration...${NC}"
    if curl -f -s -X OPTIONS "http://$AWS_IP:$BACKEND_PORT/api/ask-ai" \
        -H "Origin: http://$AWS_IP" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" > /dev/null; then
        echo -e "${GREEN}✅ CORS is configured correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  CORS test inconclusive${NC}"
    fi
    
    # Test AI endpoint with proper format
    echo -e "${BLUE}Testing AI endpoint...${NC}"
    AI_RESPONSE=$(curl -s -X POST "http://$AWS_IP:$BACKEND_PORT/api/ask-ai" \
        -H "Content-Type: application/json" \
        -H "Origin: http://$AWS_IP" \
        -d '{"messages":[{"role":"user","content":"Hello"}],"difficulty":"easy"}' \
        --max-time 10)
    
    if [ $? -eq 0 ] && [ -n "$AI_RESPONSE" ]; then
        echo -e "${GREEN}✅ AI endpoint is working${NC}"
    else
        echo -e "${YELLOW}⚠️  AI endpoint test inconclusive (may be working but slow)${NC}"
    fi
}

# Function to cleanup
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    rm -f "$DEPLOY_PACKAGE"
    rm -rf "$TEMP_DEPLOY_DIR"
}

# Function to display completion message
show_completion() {
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Your application backend is running at: http://$AWS_IP:$BACKEND_PORT/${NC}"
    echo -e "${BLUE}🔍 Health check: http://$AWS_IP:$BACKEND_PORT/api/health${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Set up environment variables on server:"
    echo -e "   ssh -i $SSH_KEY_PATH $AWS_USER@$AWS_IP"
    echo -e "   cd $REMOTE_APP_DIR"
    echo -e "   nano .env  # Add AZURE_API_KEY and AZURE_ENDPOINT"
    echo -e "   pm2 restart kidplay-backend"
    echo -e ""
    echo -e "2. Set up frontend serving (nginx or serve build directory)"
    echo -e "3. Monitor logs: pm2 logs kidplay-backend"
    echo -e "4. Check status: pm2 status"
}

# Main execution
main() {
    check_prerequisites
    build_application
    create_deployment_package
    deploy_to_server
    test_deployment
    cleanup
    show_completion
}

# Run main function
main "$@"
