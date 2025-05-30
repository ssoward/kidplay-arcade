#!/bin/bash
# AWS EC2 Deployment Script
# Run this script on your EC2 instance after cloning the repo

echo "🚀 Starting KidPlay Arcade deployment on AWS EC2..."

# Update system
sudo yum update -y

# Install Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Install PM2 for process management
npm install -g pm2

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..

# Build the React app
echo "🔨 Building React app..."
npm run build

# Set up environment variables
echo "🔧 Setting up environment..."
cp .env.example backend/.env
echo "⚠️  IMPORTANT: Edit backend/.env with your actual Azure credentials!"

# Set up PM2 ecosystem
echo "📋 Setting up PM2 process manager..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Install nginx for reverse proxy
sudo yum install -y nginx

# Configure nginx
sudo tee /etc/nginx/conf.d/kidplay-arcade.conf > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Serve static files
    location / {
        try_files \$uri \$uri/ @proxy;
    }

    # Proxy API requests to Node.js
    location @proxy {
        proxy_pass http://localhost:3000;
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
EOF

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Azure credentials"
echo "2. Start the app: pm2 start ecosystem.config.js"
echo "3. Save PM2 process: pm2 save && pm2 startup"
echo ""
echo "Your app will be available at: http://your-ec2-public-ip"
