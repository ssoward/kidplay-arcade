#!/bin/bash

# Deploy KidPlay Arcade to Amazon Linux 2 EC2 Instance
# Usage: ./deploy-to-amazon-linux.sh [IP_ADDRESS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NEW_IP="${1:-44.201.204.117}"
PEM_KEY="kidplay-arcade-new-key.pem"
SSH_USER="ec2-user"
APP_NAME="kidplay-arcade"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$NEW_IP" ]; then
    print_error "Usage: $0 [IP_ADDRESS]"
    print_error "Example: $0 44.201.204.117"
    exit 1
fi

if [ ! -f "$PEM_KEY" ]; then
    print_error "PEM key not found at $PEM_KEY"
    print_error "Please ensure the key exists and has correct permissions:"
    print_error "chmod 400 $PEM_KEY"
    exit 1
fi

print_status "Starting deployment to Amazon Linux 2 EC2 instance at $NEW_IP"

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -i "$PEM_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$NEW_IP" "echo 'SSH connection successful'" 2>/dev/null; then
    print_error "Cannot connect to $NEW_IP via SSH"
    print_error "Please check:"
    print_error "1. Instance is running and accessible"
    print_error "2. Security group allows SSH from your IP"
    print_error "3. PEM key is correct and has proper permissions"
    exit 1
fi

print_status "SSH connection successful!"

# Build the React app locally
print_status "Building React application..."
npm run build

# Create deployment package
print_status "Creating deployment package..."
tar -czf /tmp/kidplay-deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='*.tar.gz' \
    .

# Upload deployment package
print_status "Uploading application to EC2..."
scp -i "$PEM_KEY" -o StrictHostKeyChecking=no /tmp/kidplay-deployment.tar.gz "$SSH_USER@$NEW_IP:/tmp/"

# Deploy application on EC2
print_status "Setting up application on Amazon Linux 2..."
ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$NEW_IP" << 'ENDSSH'
set -e

echo "🚀 Setting up KidPlay Arcade on Amazon Linux 2..."

# Update system
sudo yum update -y

# Install Node.js 18 using NVM (compatible with Amazon Linux 2)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18
nvm alias default 18

# Get the actual Node.js path and create system-wide links
NODE_PATH=$(which node)
NPM_PATH=$(which npm)
sudo ln -sf "$NODE_PATH" /usr/local/bin/node
sudo ln -sf "$NPM_PATH" /usr/local/bin/npm

# Install PM2 globally
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install -g pm2
sudo ln -sf $(which pm2) /usr/local/bin/pm2

# Install nginx
sudo yum install -y nginx

# Install git (needed for some npm packages)
sudo yum install -y git

# Create app directory
sudo mkdir -p /var/www/kidplay-arcade
sudo chown -R ec2-user:ec2-user /var/www/kidplay-arcade

# Extract application
cd /var/www/kidplay-arcade
tar -xzf /tmp/kidplay-deployment.tar.gz
rm /tmp/kidplay-deployment.tar.gz

# Install dependencies
echo "📦 Installing dependencies..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Copy build files to nginx directory
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r build/* /usr/share/nginx/html/
sudo chown -R nginx:nginx /usr/share/nginx/html

# Configure nginx
sudo tee /etc/nginx/conf.d/kidplay-arcade.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /usr/share/nginx/html;
    index index.html;
    
    server_name _;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Backup original nginx.conf and update
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Start backend with PM2
cd /var/www/kidplay-arcade/backend
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start server.js --name "kidplay-backend"
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://$(curl -s http://checkip.amazonaws.com)/"
echo "🔧 Backend: http://$(curl -s http://checkip.amazonaws.com)/api/health"

# Test the setup
echo "🧪 Testing deployment..."
sleep 5

# Test frontend
if curl -s http://localhost/ | grep -q "KidPlay"; then
    echo "✅ Frontend is working"
else
    echo "❌ Frontend test failed"
fi

# Test backend
if curl -s http://localhost/api/health | grep -q "OK"; then
    echo "✅ Backend is working"
else
    echo "❌ Backend test failed"
fi

# Test AI endpoint
if curl -s -X POST http://localhost/api/ask-ai \
    -H "Content-Type: application/json" \
    -d '{"history":[{"role":"user","content":"Hello"}]}' | grep -q "message"; then
    echo "✅ AI endpoint is working"
else
    echo "❌ AI endpoint test failed"
fi

echo "🎉 All tests completed!"
ENDSSH

# Get the public IP and test the deployment
print_status "Getting public IP..."
PUBLIC_IP=$(ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$NEW_IP" "curl -s http://checkip.amazonaws.com/")

print_status "Deployment completed successfully!"
print_status "🌐 Website: http://$PUBLIC_IP/"
print_status "🔧 Backend API: http://$PUBLIC_IP/api/health"

# Test from local machine
print_status "Testing deployment from local machine..."
sleep 5

if curl -s "http://$PUBLIC_IP/" | grep -q "KidPlay"; then
    print_status "✅ Frontend is accessible from internet"
else
    print_warning "❌ Frontend test failed"
fi

if curl -s "http://$PUBLIC_IP/api/health" | grep -q "OK"; then
    print_status "✅ Backend API is accessible from internet"
else
    print_warning "❌ Backend API test failed"
fi

print_status "🎉 Deployment completed! Visit http://$PUBLIC_IP/ to see your application"

# Clean up
rm -f /tmp/kidplay-deployment.tar.gz

print_status "Deployment summary:"
print_status "- New EC2 IP: $PUBLIC_IP"
print_status "- Frontend: http://$PUBLIC_IP/"
print_status "- AI Endpoint: http://$PUBLIC_IP/api/ask-ai"
print_status "- SSH: ssh -i $PEM_KEY ec2-user@$NEW_IP"
