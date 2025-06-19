# SSL Setup Guide for KidPlay Arcade (amorvivir.com)

## 🔒 SSL Certificate Setup with Let's Encrypt

**Domain:** amorvivir.com, www.amorvivir.com  
**Server:** AWS EC2 (3.88.41.133)  
**Current Status:** HTTP working, HTTPS not configured  

## 📋 Prerequisites

1. **Domain Configuration** ✅
   - amorvivir.com → 3.88.41.133
   - www.amorvivir.com → 3.88.41.133
   - DNS propagation complete

2. **Server Access Required**
   - SSH access to AWS EC2 instance
   - Admin privileges (sudo access)
   - Port 443 open in AWS Security Group

## 🚀 SSL Setup Steps

### Step 1: Open Port 443 in AWS Security Group

```bash
# Check current security group
aws ec2 describe-instances --instance-ids i-06a45bb65c867ce91 \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTPS rule to security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-03291002d10b0d3c0 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### Step 2: Install Certbot on Server

```bash
# SSH to server
ssh -i ~/.ssh/kidplay-arcade-new-key.pem ubuntu@3.88.41.133

# Update system
sudo dnf update -y

# Install EPEL and certbot
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 3: Configure Nginx for SSL

```bash
# Backup current nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create SSL-ready nginx configuration
sudo tee /etc/nginx/sites-available/kidplay-arcade-ssl > /dev/null << 'EOF'
server {
    listen 80;
    server_name amorvivir.com www.amorvivir.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name amorvivir.com www.amorvivir.com;
    
    # SSL certificate files (will be created by certbot)
    ssl_certificate /etc/letsencrypt/live/amorvivir.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/amorvivir.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Serve frontend
    root /var/www/kidplay-arcade/build;
    index index.html;
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
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
        proxy_redirect off;
    }
    
    # Static assets optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
}
EOF

# Enable the new configuration
sudo ln -sf /etc/nginx/sites-available/kidplay-arcade-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
```

### Step 4: Obtain SSL Certificate

```bash
# Stop nginx temporarily for standalone verification
sudo systemctl stop nginx

# Obtain SSL certificate for both domains
sudo certbot certonly --standalone \
  -d amorvivir.com \
  -d www.amorvivir.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Start nginx with SSL configuration
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Set Up Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Or use systemd timer (preferred on Amazon Linux 2023)
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

## 🧪 Testing SSL Setup

### Test Commands
```bash
# Test HTTPS connectivity
curl -I https://amorvivir.com

# Test SSL certificate
openssl s_client -connect amorvivir.com:443 -servername amorvivir.com

# Test SSL rating
curl -I https://amorvivir.com | grep -i "strict-transport"

# Test redirect from HTTP to HTTPS
curl -I http://amorvivir.com
```

### Expected Results
- ✅ HTTPS loads correctly
- ✅ HTTP redirects to HTTPS  
- ✅ SSL certificate valid for both domains
- ✅ Security headers present
- ✅ All games work over HTTPS

## 🔧 Backend Configuration Updates

Update backend to handle HTTPS:

```bash
# Update backend .env
cd /var/www/kidplay-arcade
nano .env

# Add/update these lines:
ALLOWED_ORIGINS=https://amorvivir.com,https://www.amorvivir.com,http://localhost:3000,http://localhost:3001
NODE_ENV=production
PORT=3001

# Restart backend
pm2 restart kidplay-backend
```

## 🛡️ Security Enhancements

### HSTS Configuration
The nginx configuration includes HSTS headers to enforce HTTPS.

### Mixed Content Prevention
Ensure all resources load over HTTPS:

```javascript
// Update API configuration if needed
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://amorvivir.com/api'
  : 'http://localhost:3001/api';
```

## 📊 Monitoring & Maintenance

### SSL Certificate Monitoring
```bash
# Check certificate expiration
sudo certbot certificates

# Manual renewal if needed
sudo certbot renew

# Check renewal status
sudo systemctl status certbot-renew.timer
```

### Performance Testing
```bash
# Test SSL performance
curl -w "@curl-format.txt" -o /dev/null -s https://amorvivir.com

# SSL Labs test (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=amorvivir.com
```

## 🚨 Troubleshooting

### Common Issues

**1. Port 443 Blocked**
```bash
# Check AWS Security Group
aws ec2 describe-security-groups --group-ids sg-03291002d10b0d3c0
```

**2. Certificate Generation Failed**
```bash
# Check DNS resolution
nslookup amorvivir.com
dig amorvivir.com

# Verify server accessibility
curl -I http://amorvivir.com
```

**3. Nginx Configuration Error**
```bash
# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

**4. Mixed Content Issues**
- Update all API calls to use HTTPS
- Check for hardcoded HTTP URLs in frontend
- Verify API_CONFIG uses correct protocol

## ✅ Post-Setup Checklist

- [ ] HTTPS loads correctly for amorvivir.com
- [ ] HTTPS loads correctly for www.amorvivir.com  
- [ ] HTTP redirects to HTTPS
- [ ] All games work over HTTPS
- [ ] API calls work over HTTPS
- [ ] SSL certificate auto-renewal configured
- [ ] Security headers present
- [ ] Backend CORS updated for HTTPS origins

---

**Next Steps:** Once SSL is configured, update the PRD and all documentation to use HTTPS URLs.
