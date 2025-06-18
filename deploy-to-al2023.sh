#!/bin/bash

# KidPlay Arcade - Application Deployment for Amazon Linux 2023
# Modern deployment with proper error handling and backup strategies

set -e

echo "🚀 KidPlay Arcade - AL2023 Application Deployment"
echo "================================================"

# Configuration (you'll need to update these after creating the instance)
PUBLIC_IP="3.88.41.133"
KEY_FILE="/Users/ssoward/.ssh/KidPlayArcade001.pem"
INSTANCE_USER="ec2-user"

echo "📋 Deployment Configuration:"
echo "   Target: $INSTANCE_USER@$PUBLIC_IP"
echo "   Key: $KEY_FILE"
echo "   OS: Amazon Linux 2023"
echo ""

if [[ "$PUBLIC_IP" == "<UPDATE_WITH_INSTANCE_IP>" ]]; then
    echo "⚠️  Please update PUBLIC_IP and KEY_FILE variables in this script first!"
    echo "   Edit: deploy-to-al2023.sh"
    echo "   Set PUBLIC_IP to your instance's public IP"
    echo "   Set KEY_FILE to your PEM file name"
    exit 1
fi

# Step 1: Build the application locally
echo "🔨 Step 1: Building Application..."
echo "Building React frontend..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed - no build directory found"
    exit 1
fi

echo "✅ Frontend built successfully"

# Step 2: Create deployment package
echo "📦 Step 2: Creating Deployment Package..."
DEPLOY_PACKAGE="kidplay-al2023-$(date +%s).tar.gz"

tar -czf "$DEPLOY_PACKAGE" \
    --exclude="node_modules" \
    --exclude="*.pem" \
    --exclude="*.tar.gz" \
    --exclude=".git" \
    --exclude=".env*" \
    build/ \
    backend/ \
    package.json \
    package-lock.json

echo "✅ Package created: $DEPLOY_PACKAGE"

# Step 3: Test SSH connection
echo "🔌 Step 3: Testing SSH Connection..."
for i in {1..5}; do
    if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$INSTANCE_USER@$PUBLIC_IP" "echo 'SSH OK'" 2>/dev/null; then
        echo "✅ SSH connection successful"
        break
    else
        echo "   Attempt $i/5: SSH connection failed, retrying in 30 seconds..."
        if [ $i -eq 5 ]; then
            echo "❌ SSH connection failed after 5 attempts"
            echo "Please check:"
            echo "1. Security group allows SSH (port 22)"
            echo "2. Instance is running and has public IP"
            echo "3. Key file permissions: chmod 400 $KEY_FILE"
            exit 1
        fi
        sleep 30
    fi
done

# Step 4: Transfer deployment package
echo "📤 Step 4: Transferring Deployment Package..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no "$DEPLOY_PACKAGE" "$INSTANCE_USER@$PUBLIC_IP:~/"
echo "✅ Package transferred"

# Step 5: Deploy application on AL2023 server
echo "🚀 Step 5: Deploying Application on Amazon Linux 2023..."

ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$INSTANCE_USER@$PUBLIC_IP" << EOF
echo "🔧 Setting up Amazon Linux 2023 environment..."

# Update system
sudo dnf update -y

# Install Node.js 18 (AL2023 has modern package management)
sudo dnf install -y nodejs npm

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo dnf install -y nginx

# Extract deployment package
PACKAGE=\$(ls kidplay-al2023-*.tar.gz | head -1)
tar -xzf "\$PACKAGE"
echo "📦 Package extracted: \$PACKAGE"

# Setup backend
echo "⚙️ Setting up backend..."
cd backend/
npm install --production

# Create production environment file
cat > .env.production << 'ENVEOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://$PUBLIC_IP
ENVEOF

# Start backend with PM2
pm2 stop kidplay-backend 2>/dev/null || true
pm2 start server.js --name "kidplay-backend" --env production
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

cd ..

# Setup frontend with nginx
echo "🌐 Setting up frontend..."
sudo mkdir -p /var/www/html
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo chown -R nginx:nginx /var/www/html/

# Configure nginx for AL2023
sudo tee /etc/nginx/conf.d/kidplay.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall for AL2023
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

echo "✅ AL2023 Deployment completed!"
echo ""
echo "📊 Service Status:"
pm2 status
sudo systemctl status nginx --no-pager -l

echo ""
echo "🌐 Application URLs:"
echo "Frontend: http://$PUBLIC_IP"
echo "Backend API: http://$PUBLIC_IP:3001"
EOF

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📊 Application Status:"
echo "====================="
echo "Frontend: http://$PUBLIC_IP"
echo "Backend API: http://$PUBLIC_IP:3001"
echo "SSH Access: ssh -i $KEY_FILE $INSTANCE_USER@$PUBLIC_IP"
echo ""
echo "🔗 Test the application by visiting: http://$PUBLIC_IP"

# Save deployment info
cat > al2023-deployment-info.txt << EOF
KidPlay Arcade - Amazon Linux 2023 Deployment
=============================================
Date: $(date)
Frontend URL: http://$PUBLIC_IP
Backend API: http://$PUBLIC_IP:3001
SSH Access: ssh -i $KEY_FILE $INSTANCE_USER@$PUBLIC_IP
Deployment Package: $DEPLOY_PACKAGE

Services:
- Frontend: Nginx on port 80
- Backend: PM2 managed Node.js on port 3001
- Database: SQLite (local file)
- OS: Amazon Linux 2023

Key Features:
- Modern dnf package manager
- Built-in firewall configuration
- Improved security and performance
EOF

echo "💾 Deployment info saved to: al2023-deployment-info.txt"
