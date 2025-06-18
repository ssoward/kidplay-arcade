# KidPlay Arcade - Security Configuration Guide
# Comprehensive security settings for Amazon Linux 2023 deployment

echo "🔒 KidPlay Arcade - Security Hardening Guide"
echo "============================================="

## CRITICAL SECURITY SETTINGS TO CONFIGURE

### 1. EC2 INSTANCE SECURITY SETTINGS

#### A. Security Group Configuration (Restrictive Access)
```bash
# Create security group with minimal access
aws ec2 create-security-group \
    --group-name kidplay-secure-sg \
    --description "KidPlay Arcade - Secure Configuration" \
    --region us-east-1

# SSH - Restrict to your IP only (CRITICAL)
YOUR_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr ${YOUR_IP}/32 \
    --region us-east-1

# HTTP - Allow public access
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

# HTTPS - For future SSL setup
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

# Backend API - Restrict to application server only (remove public access)
# Only allow internal nginx proxy to access port 3001
```

#### B. EBS Volume Encryption
```bash
# Launch instance with encrypted EBS volumes
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t2.micro \
    --key-name your-key \
    --security-group-ids sg-xxxxxxxxx \
    --block-device-mappings '[{
        "DeviceName":"/dev/xvda",
        "Ebs":{
            "VolumeSize":20,
            "VolumeType":"gp3",
            "Encrypted":true,
            "DeleteOnTermination":false
        }
    }]' \
    --metadata-options HttpTokens=required,HttpPutResponseHopLimit=1,HttpEndpoint=enabled \
    --region us-east-1
```

### 2. SSH KEY MANAGEMENT

#### A. Secure SSH Configuration
```bash
# On your local machine - secure the PEM file
chmod 400 ~/.ssh/your-key.pem

# Create SSH config for easier access
cat >> ~/.ssh/config << EOF
Host kidplay-prod
    HostName YOUR_INSTANCE_IP
    User ec2-user
    IdentityFile ~/.ssh/your-key.pem
    StrictHostKeyChecking yes
    UserKnownHostsFile ~/.ssh/known_hosts
    IdentitiesOnly yes
    Protocol 2
EOF
```

#### B. Disable Password Authentication (Server-side)
```bash
# On the EC2 instance
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 3. SYSTEM HARDENING

#### A. Firewall Configuration (firewalld)
```bash
# Configure firewalld for AL2023
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Remove default zones and create custom zone
sudo firewall-cmd --permanent --new-zone=kidplay
sudo firewall-cmd --permanent --zone=kidplay --set-target=DROP

# Allow only necessary services
sudo firewall-cmd --permanent --zone=kidplay --add-service=ssh
sudo firewall-cmd --permanent --zone=kidplay --add-service=http
sudo firewall-cmd --permanent --zone=kidplay --add-service=https

# Block backend port from external access
sudo firewall-cmd --permanent --zone=kidplay --add-rich-rule='
  rule family="ipv4" 
  source address="127.0.0.1" 
  port port="3001" protocol="tcp" 
  accept'

# Set default zone
sudo firewall-cmd --set-default-zone=kidplay
sudo firewall-cmd --reload
```

#### B. Fail2ban Installation
```bash
# Install and configure fail2ban
sudo dnf install -y epel-release
sudo dnf install -y fail2ban

# Configure fail2ban for SSH protection
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. APPLICATION SECURITY

#### A. Node.js Security Headers
```javascript
// Add to backend/server.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

#### B. Nginx Security Configuration
```nginx
# Add to /etc/nginx/conf.d/kidplay.conf
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Hide nginx version
    server_tokens off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=1r/s;
    
    root /var/www/html;
    index index.html;

    # Frontend routes
    location / {
        limit_req zone=general burst=5 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Security headers for API
        proxy_hide_header X-Powered-By;
    }
    
    # Block access to sensitive files
    location ~ /\.(git|env) {
        deny all;
    }
    
    location ~ /\.ht {
        deny all;
    }
}
```

### 5. DATABASE SECURITY

#### A. SQLite Security
```bash
# Secure database file permissions
chmod 600 ~/backend/kidplay_arcade.db
chown ec2-user:ec2-user ~/backend/kidplay_arcade.db

# Create secure backup directory
mkdir -p ~/backups
chmod 700 ~/backups
```

#### B. Environment Variables Security
```bash
# Secure environment file
chmod 600 ~/backend/.env.production

# Add security-focused environment variables
cat >> ~/backend/.env.production << 'EOF'
# Security settings
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://YOUR_DOMAIN
EOF
```

### 6. MONITORING AND LOGGING

#### A. System Monitoring
```bash
# Install and configure auditd
sudo dnf install -y audit
sudo systemctl enable auditd
sudo systemctl start auditd

# Configure audit rules
sudo tee -a /etc/audit/rules.d/audit.rules > /dev/null << 'EOF'
# Monitor authentication
-w /var/log/secure -p wa -k auth
-w /etc/passwd -p wa -k passwd_changes
-w /etc/group -p wa -k group_changes

# Monitor configuration changes
-w /etc/nginx/ -p wa -k nginx_config
-w /etc/ssh/sshd_config -p wa -k ssh_config

# Monitor application files
-w /home/ec2-user/backend/ -p wa -k app_changes
EOF

sudo service auditd restart
```

#### B. Log Management
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/kidplay > /dev/null << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}

/home/ec2-user/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    su ec2-user ec2-user
}
EOF
```

### 7. SSL/TLS CONFIGURATION (Recommended)

#### A. Let's Encrypt SSL Setup
```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 8. BACKUP SECURITY

#### A. Encrypted Backups
```bash
# Create encrypted backup script
cat > ~/secure-backup.sh << 'EOF'
#!/bin/bash
BACKUP_PASSWORD=$(openssl rand -base64 32)
DATE=$(date +%Y%m%d-%H%M%S)

# Encrypt database backup
gpg --symmetric --cipher-algo AES256 --compress-algo 1 \
    --output ~/backups/kidplay_arcade_${DATE}.db.gpg \
    ~/backend/kidplay_arcade.db

# Store password securely (AWS Parameter Store recommended)
echo "Backup password: $BACKUP_PASSWORD" >> ~/backups/passwords.log
EOF

chmod 700 ~/secure-backup.sh
```

## SECURITY CHECKLIST

### ✅ Instance Security
- [ ] Security group restricts SSH to your IP only
- [ ] EBS volumes are encrypted
- [ ] IMDSv2 is enforced
- [ ] Regular security updates scheduled

### ✅ Network Security  
- [ ] Firewall configured with minimal ports
- [ ] Backend API not accessible from internet
- [ ] Rate limiting implemented
- [ ] Fail2ban configured for SSH protection

### ✅ Application Security
- [ ] Security headers implemented
- [ ] HTTPS/SSL configured
- [ ] Input validation and sanitization
- [ ] Secrets stored securely (not in code)

### ✅ Access Control
- [ ] SSH key-based authentication only
- [ ] Strong passwords/keys used
- [ ] Principle of least privilege applied
- [ ] Regular access review scheduled

### ✅ Monitoring
- [ ] System audit logging enabled
- [ ] Application logging configured
- [ ] Security alerts set up
- [ ] Log retention policy implemented

### ✅ Backup Security
- [ ] Backups are encrypted
- [ ] Backup storage is secure
- [ ] Recovery procedures tested
- [ ] Backup integrity verified

## IMMEDIATE SECURITY ACTIONS

1. **Restrict SSH access to your IP only**
2. **Enable firewall with minimal ports**
3. **Configure fail2ban for brute force protection**
4. **Set up SSL/HTTPS**
5. **Implement rate limiting**
6. **Enable audit logging**
7. **Secure file permissions**
8. **Regular security updates**

## ONGOING SECURITY MAINTENANCE

- **Weekly**: Review access logs and security alerts
- **Monthly**: Update system packages and dependencies  
- **Quarterly**: Security audit and penetration testing
- **Annually**: Review and update security policies

---

**⚠️ CRITICAL**: Always test security configurations in a development environment first!
