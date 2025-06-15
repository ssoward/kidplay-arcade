#!/bin/bash

# Quick deployment to existing instance
set -e

INSTANCE_IP="18.215.173.27"
KEY_FILE="/Users/ssoward/.ssh/kidplay-key-1749063985.pem"

echo "🚀 Deploying to $INSTANCE_IP..."

# Test SSH
echo "📡 Testing SSH connection..."
if ! ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ec2-user@"$INSTANCE_IP" "echo 'ready'" 2>/dev/null; then
    echo "⚠️  SSH not ready yet. Instance may still be initializing..."
    echo "💡 Try again in a few minutes with: ./quick-deploy.sh"
    exit 1
fi

echo "✅ SSH connection successful!"

# Upload deployment package
echo "📦 Uploading deployment package..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no deploy.tar.gz ec2-user@"$INSTANCE_IP":~/

# Create and run deployment script
echo "🔧 Running deployment on server..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@"$INSTANCE_IP" << 'DEPLOY'
#!/bin/bash
set -e
echo "$(date) - Starting deployment..."

# Extract application
cd ~
tar -xzf deploy.tar.gz
echo "$(date) - Application extracted"

# Check if Node.js is available (user data might still be running)
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not yet available. User data script may still be running."
    echo "💡 Check /var/log/user-data.log for setup progress"
    sudo tail -20 /var/log/user-data.log || echo "User data log not found"
    exit 1
fi

echo "✅ Node.js available: $(node --version)"

# Set up frontend with nginx
sudo mkdir -p /var/www/html
sudo cp -r build/* /var/www/html/
sudo chown -R nginx:nginx /var/www/html/

# Configure nginx
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo systemctl restart nginx
echo "$(date) - Nginx configured and restarted"

# Set up backend
cd ~/backend
npm install
echo "$(date) - Backend dependencies installed"

# Start backend with PM2
pm2 delete all 2>/dev/null || true
pm2 start app.js --name "kidplay-backend"
pm2 save
echo "$(date) - Backend started with PM2"

echo "$(date) - Deployment complete!"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
DEPLOY

echo ""
echo "🎉 Deployment Complete!"
echo "🌐 Your KidPlay Arcade is now live at: http://$INSTANCE_IP"
echo "🔧 Backend API available at: http://$INSTANCE_IP:3001"
echo ""
echo "📝 SSH Connection:"
echo "   ssh -i $KEY_FILE ec2-user@$INSTANCE_IP"
