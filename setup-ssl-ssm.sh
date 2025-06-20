#!/bin/bash

# SSL Setup via AWS Systems Manager Session Manager
# This method doesn't require SSH access

echo "🔒 Setting up SSL via AWS Systems Manager..."

# Configuration
INSTANCE_ID="i-06a45bb65c867ce91"
DOMAIN="amorvivir.com"
WWW_DOMAIN="www.amorvivir.com"
EMAIL="admin@amorvivir.com"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    echo "   brew install awscli"
    exit 1
fi

# Check if Session Manager plugin is available
if ! aws ssm start-session --target $INSTANCE_ID --dry-run 2>/dev/null; then
    echo "❌ Session Manager not available or not configured."
    echo "   Please ensure:"
    echo "   1. AWS CLI is configured with proper credentials"
    echo "   2. Session Manager plugin is installed"
    echo "   3. Instance has SSM role attached"
    exit 1
fi

echo "🚀 Executing SSL setup via Session Manager..."

# Create SSL setup commands
SSL_COMMANDS='
#!/bin/bash
set -e

echo "🔧 Installing Certbot..."
sudo dnf update -y
sudo dnf install -y epel-release certbot python3-certbot-nginx

echo "🔧 Backing up nginx config..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

echo "🔧 Configuring nginx for SSL..."
sudo tee /etc/nginx/conf.d/kidplay-ssl.conf > /dev/null << "NGINXEOF"
server {
    listen 80;
    server_name amorvivir.com www.amorvivir.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name amorvivir.com www.amorvivir.com;
    
    ssl_certificate /etc/letsencrypt/live/amorvivir.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/amorvivir.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    root /var/www/kidplay-arcade/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

echo "🔧 Testing nginx configuration..."
sudo nginx -t

echo "🔒 Obtaining SSL certificate..."
sudo systemctl stop nginx

sudo certbot certonly --standalone \
  -d amorvivir.com \
  -d www.amorvivir.com \
  --email admin@amorvivir.com \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "🚀 Starting nginx with SSL..."
sudo systemctl start nginx
sudo systemctl reload nginx

echo "🔄 Setting up auto-renewal..."
echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -

echo "🔧 Updating backend CORS..."
cd /var/www/kidplay-arcade
sudo sed -i "s/ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=https:\/\/amorvivir.com,https:\/\/www.amorvivir.com,http:\/\/localhost:3000,http:\/\/localhost:3001/" .env
sudo -u ubuntu pm2 restart kidplay-backend

echo "✅ SSL setup completed!"
'

# Execute commands via Session Manager
echo "$SSL_COMMANDS" | aws ssm start-session \
    --target $INSTANCE_ID \
    --document-name AWS-StartInteractiveCommand \
    --parameters command="bash"

echo "🎉 SSL setup completed via Session Manager!"
echo "🔗 Your site should now be available at: https://amorvivir.com"
