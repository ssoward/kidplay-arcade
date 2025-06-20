# SSL Setup Instructions for KidPlay Arcade (amorvivir.com)

## 🔒 SSL Configuration Required

**Current Status:**
- ✅ Domain: amorvivir.com and www.amorvivir.com point to 3.88.41.133
- ✅ HTTP working: http://amorvivir.com
- ❌ HTTPS not configured: https://amorvivir.com (port 443 blocked)
- ❌ SSH access restricted (admin IP only: 216.49.181.253/32)

## 🚨 SSH Access Issue

The SSH connection is timing out because the AWS Security Group restricts SSH access to admin IPs only. To proceed with SSL setup, you'll need:

### Option 1: Admin SSH Access
If you have admin access from the allowed IP (216.49.181.253), you can run:

```bash
# From the admin IP, run the SSL setup
./setup-ssl.sh
```

### Option 2: Update Security Group
If you can access AWS Console, temporarily add your current IP to the security group:

```bash
# Get your current IP
curl ifconfig.me

# Add to AWS Security Group (replace with your IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-03291002d10b0d3c0 \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_CURRENT_IP/32
```

### Option 3: Alternative Deployment Method
Since the production server is working, there might be an automated deployment process. Check if:
- GitHub Actions or webhooks are configured
- The server auto-deploys from git repository
- There's a CI/CD pipeline in place

## 🔧 Manual SSL Commands (If SSH Access Available)

If you can SSH to the server, run these commands:

```bash
# Connect to server
ssh -i /Users/ssoward/.ssh/KidPlayArcade001.pem ubuntu@3.88.41.133

# Install Certbot
sudo dnf update -y
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  -d amorvivir.com \
  -d www.amorvivir.com \
  --email admin@amorvivir.com \
  --agree-tos \
  --no-eff-email \
  --non-interactive

# Configure nginx for HTTPS (create new config)
sudo tee /etc/nginx/conf.d/ssl.conf > /dev/null << 'EOF'
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
    
    root /var/www/kidplay-arcade/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and start nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -

# Update backend CORS
cd /var/www/kidplay-arcade
sudo sed -i 's/ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=https:\/\/amorvivir.com,https:\/\/www.amorvivir.com,http:\/\/localhost:3000/' .env
sudo pm2 restart kidplay-backend

echo "✅ SSL setup complete!"
```

## 🧪 Testing SSL (After Setup)

```bash
# Test HTTPS
curl -I https://amorvivir.com

# Test redirect
curl -I http://amorvivir.com

# Test SSL certificate
openssl s_client -connect amorvivir.com:443 -servername amorvivir.com < /dev/null
```

## 🔍 Current Network Status

```
HTTP:  http://amorvivir.com       ✅ Working
HTTPS: https://amorvivir.com      ❌ Not configured
SSH:   ubuntu@3.88.41.133:22     ❌ Access restricted
```

## 📞 Next Steps

1. **Verify SSH Access**: Ensure you can SSH from an allowed IP
2. **Run SSL Setup**: Execute the manual commands above
3. **Test HTTPS**: Verify SSL certificate and HTTPS functionality
4. **Update Documentation**: Update URLs to use HTTPS

Once SSL is configured, the site will be secure and all API calls will work properly over HTTPS! 🔒
