#!/bin/bash
# AWS EC2 Deployment Script
# Run this script on your EC2 instance after cloning the repo

echo "🚀 Starting KidPlay Arcade deployment on AWS EC2..."

# Update system
sudo yum update -y

# Install Node.js 16 (compatible with Amazon Linux 2 GLIBC 2.26)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16.20.2
nvm use 16.20.2

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
cat > .env << EOF
# Placeholder environment variables for demo
AZURE_API_KEY=placeholder_key
AZURE_ENDPOINT=placeholder_endpoint
PORT=3001
NODE_ENV=production
EOF
echo "⚠️  IMPORTANT: Edit .env with your actual Azure credentials!"

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
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
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

# Create logs directory
mkdir -p logs

# Install nginx for reverse proxy
echo "📦 Installing nginx..."
sudo amazon-linux-extras install -y nginx1

# Configure nginx
echo "🔧 Configuring nginx..."
sudo tee /etc/nginx/conf.d/kidplay-arcade.conf > /dev/null << EOF
server {
    listen 80;
    server_name _;
    root /home/ec2-user/kidplay-arcade/build;
    index index.html;

    # Serve static files
    location / {
        try_files \\\$uri \\\$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Fix file permissions for nginx
echo "🔒 Setting up file permissions..."
chmod 755 /home/ec2-user
chmod -R 755 /home/ec2-user/kidplay-arcade/build

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Start the application
echo "🚀 Starting the application..."
pm2 start ecosystem.config.js

# Set up PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v16.20.2/bin /home/ec2-user/.nvm/versions/node/v16.20.2/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

echo "✅ Setup complete!"
echo ""
echo "🎉 Your KidPlay Arcade is now running!"
echo "📋 Application Status:"
pm2 status
echo ""
echo "🌐 Access your app at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env with your actual Azure credentials for AI features"
echo "2. Restart backend: pm2 restart kidplay-arcade"
echo ""
echo "🔧 Useful commands:"
echo "- View logs: pm2 logs kidplay-arcade"
echo "- Restart app: pm2 restart kidplay-arcade"
echo "- Check status: pm2 status"
