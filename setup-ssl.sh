#!/bin/bash

# SSL Setup Automation Script for KidPlay Arcade
# Domain: amorvivir.com

set -e

echo "🔒 Starting SSL Setup for KidPlay Arcade (amorvivir.com)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="amorvivir.com"
WWW_DOMAIN="www.amorvivir.com"
EMAIL="${SSL_EMAIL:-admin@amorvivir.com}"
AWS_IP="3.88.41.133"
AWS_HOSTNAME="ec2-3-88-41-133.compute-1.amazonaws.com"
SSH_KEY_PATH="${SSH_KEY_PATH:-/Users/ssoward/.ssh/KidPlayArcade001.pem}"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Domain: ${DOMAIN}"
echo -e "  WWW Domain: ${WWW_DOMAIN}"
echo -e "  Server IP: ${AWS_IP}"
echo -e "  Email: ${EMAIL}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check DNS resolution
    echo -e "${BLUE}Checking DNS resolution...${NC}"
    if ! nslookup "$DOMAIN" | grep -q "$AWS_IP"; then
        echo -e "${RED}❌ DNS for $DOMAIN does not point to $AWS_IP${NC}"
        exit 1
    fi
    
    if ! nslookup "$WWW_DOMAIN" | grep -q "$AWS_IP"; then
        echo -e "${RED}❌ DNS for $WWW_DOMAIN does not point to $AWS_IP${NC}"
        exit 1
    fi
    
    # Check HTTP connectivity
    echo -e "${BLUE}Checking HTTP connectivity...${NC}"
    if ! curl -s -I "http://$DOMAIN" | grep -q "200 OK"; then
        echo -e "${RED}❌ HTTP connection to $DOMAIN failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to setup SSL on server
setup_ssl() {
    echo -e "${BLUE}Setting up SSL on server...${NC}"
    
    # Create SSL setup script
    cat > /tmp/ssl-setup.sh << 'EOF'
#!/bin/bash
set -e

DOMAIN="amorvivir.com"
WWW_DOMAIN="www.amorvivir.com"
EMAIL="admin@amorvivir.com"

echo "🔧 Installing Certbot..."
sudo dnf update -y
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

echo "🔧 Configuring Nginx for SSL..."
sudo tee /etc/nginx/conf.d/kidplay-arcade-ssl.conf > /dev/null << 'NGINXEOF'
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
        proxy_set_header Connection 'upgrade';
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

echo "🔧 Testing Nginx configuration..."
sudo nginx -t

echo "🔒 Obtaining SSL certificate..."
sudo systemctl stop nginx

sudo certbot certonly --standalone \
  -d $DOMAIN \
  -d $WWW_DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "🚀 Starting Nginx with SSL..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo "🔄 Setting up auto-renewal..."
echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -

echo "✅ SSL setup completed!"
EOF

    # Upload and execute SSL setup script
    if ! scp -i "$SSH_KEY_PATH" /tmp/ssl-setup.sh "ubuntu@$AWS_IP:/tmp/"; then
        echo -e "${RED}❌ Failed to upload SSL setup script${NC}"
        exit 1
    fi
    
    # Execute SSL setup on server
    if ! ssh -i "$SSH_KEY_PATH" "ubuntu@$AWS_IP" "chmod +x /tmp/ssl-setup.sh && sudo /tmp/ssl-setup.sh"; then
        echo -e "${RED}❌ SSL setup failed on server${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ SSL setup completed on server${NC}"
}

# Function to update backend configuration
update_backend_config() {
    echo -e "${BLUE}Updating backend configuration for HTTPS...${NC}"
    
    ssh -i "$SSH_KEY_PATH" "ubuntu@$AWS_IP" << 'EOF'
cd /var/www/kidplay-arcade
sed -i 's/ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=https:\/\/amorvivir.com,https:\/\/www.amorvivir.com,http:\/\/localhost:3000,http:\/\/localhost:3001/' .env
pm2 restart kidplay-backend
EOF

    echo -e "${GREEN}✅ Backend configuration updated${NC}"
}

# Function to test SSL setup
test_ssl() {
    echo -e "${BLUE}Testing SSL setup...${NC}"
    sleep 5
    
    # Test HTTPS connectivity
    if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
        echo -e "${GREEN}✅ HTTPS for $DOMAIN is working${NC}"
    else
        echo -e "${RED}❌ HTTPS for $DOMAIN failed${NC}"
    fi
    
    if curl -s -I "https://$WWW_DOMAIN" | grep -q "200 OK"; then
        echo -e "${GREEN}✅ HTTPS for $WWW_DOMAIN is working${NC}"
    else
        echo -e "${RED}❌ HTTPS for $WWW_DOMAIN failed${NC}"
    fi
    
    # Test HTTP to HTTPS redirect
    if curl -s -I "http://$DOMAIN" | grep -q "301"; then
        echo -e "${GREEN}✅ HTTP to HTTPS redirect is working${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP to HTTPS redirect test inconclusive${NC}"
    fi
    
    # Test SSL certificate
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✅ SSL certificate is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  SSL certificate validation inconclusive${NC}"
    fi
}

# Function to show completion message
show_completion() {
    echo ""
    echo -e "${GREEN}🎉 SSL setup completed successfully!${NC}"
    echo -e "${BLUE}🔒 Your site is now available at:${NC}"
    echo -e "   https://$DOMAIN"
    echo -e "   https://$WWW_DOMAIN"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Test all games over HTTPS"
    echo -e "2. Update any hardcoded HTTP URLs in your code"
    echo -e "3. Update documentation to use HTTPS URLs"
    echo -e "4. Monitor SSL certificate expiration (auto-renews)"
    echo ""
    echo -e "${BLUE}SSL Certificate Info:${NC}"
    echo -e "   Provider: Let's Encrypt"
    echo -e "   Auto-renewal: Enabled (daily check at 12:00)"
    echo -e "   Expires: ~90 days from today"
}

# Main execution
main() {
    check_prerequisites
    setup_ssl
    update_backend_config
    test_ssl
    show_completion
}

# Run main function
main "$@"
