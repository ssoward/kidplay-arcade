# 🔒 KidPlay Arcade - IMMEDIATE Security Actions

## ⚠️ CRITICAL - Do These FIRST (Before Deployment)

### 1. **Restrict SSH Access to Your IP Only**
```bash
# Get your current IP
YOUR_IP=$(curl -s ifconfig.me)
echo "Your IP: $YOUR_IP"

# Update security group to only allow SSH from your IP
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr ${YOUR_IP}/32 \
    --region us-east-1

# Remove the default 0.0.0.0/0 SSH rule
aws ec2 revoke-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region us-east-1
```

### 2. **Secure the PEM File Immediately**
```bash
# Move to secure location
mv your-key.pem ~/.ssh/
chmod 400 ~/.ssh/your-key.pem

# Never commit PEM files to git
echo "*.pem" >> .gitignore
```

### 3. **Remove Backend Port from Public Access**
```bash
# Remove public access to port 3001 (backend should only be accessed via nginx proxy)
aws ec2 revoke-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region us-east-1
```

## 🛡️ RUN IMMEDIATELY AFTER INSTANCE CREATION

### 1. **Upload and Run Security Hardening Script**
```bash
# Upload the security script
scp -i ~/.ssh/your-key.pem harden-security.sh ec2-user@YOUR_IP:~/

# Connect and run security hardening
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_IP
chmod +x harden-security.sh
./harden-security.sh
```

### 2. **Quick Manual Security Setup** (if script fails)
```bash
# Update system
sudo dnf update -y

# Secure SSH
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Basic firewall
sudo dnf install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --remove-service=ssh --zone=public
sudo firewall-cmd --permanent --add-service=ssh --zone=public
sudo firewall-cmd --permanent --add-service=http --zone=public
sudo firewall-cmd --reload
```

## 🚀 SECURITY SETTINGS FOR DEPLOYMENT

### Update Your Deployment Scripts

#### A. **deploy-to-al2023.sh** - Add Security
```bash
# Add these lines to your nginx configuration in deploy-to-al2023.sh:

# Replace the nginx config section with:
sudo tee /etc/nginx/conf.d/kidplay.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=5r/s;

    # Frontend routes
    location / {
        limit_req zone=general burst=5 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # API proxy - ONLY accessible via nginx, not directly
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3001;  # Only localhost access
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header X-Powered-By;
    }

    # Block sensitive files
    location ~ /\.(git|env|config) {
        deny all;
    }
}
NGINXEOF
```

#### B. **Backend Security Environment Variables**
```bash
# Add to your .env.production file:
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=http://YOUR_DOMAIN_OR_IP
TRUST_PROXY=true
```

## 📊 SECURITY VALIDATION

### After Deployment, Verify Security:
```bash
# 1. Check SSH access is restricted
nmap -p 22 YOUR_IP

# 2. Verify backend port is not accessible externally
nmap -p 3001 YOUR_IP

# 3. Test rate limiting
curl -I http://YOUR_IP/api/test  # Should work
# Rapid requests should be rate limited

# 4. Check security headers
curl -I http://YOUR_IP  # Should show security headers

# 5. Run security check
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_IP './security-check.sh'
```

## 🔥 EMERGENCY SECURITY MEASURES

### If You Suspect Compromise:
```bash
# 1. Immediately block all traffic
sudo firewall-cmd --panic-on

# 2. Check for unauthorized access
sudo last -n 20
sudo grep "Failed\|Accepted" /var/log/secure | tail -20

# 3. Create forensic snapshot
aws ec2 create-snapshot --volume-id vol-xxxxxxxxx --description "Emergency security snapshot"

# 4. If confirmed breach - terminate and restore from backup
aws ec2 terminate-instances --instance-ids i-xxxxxxxxx
# Then restore from clean AMI/snapshot
```

## 🎯 PRIORITY ORDER

### Do in this exact order:
1. ✅ **Restrict SSH to your IP only**
2. ✅ **Secure PEM file location and permissions**  
3. ✅ **Remove backend port from public access**
4. ✅ **Run security hardening script**
5. ✅ **Deploy application with security configs**
6. ✅ **Validate security measures**
7. ✅ **Set up monitoring and alerting**

### ⚠️ NEVER DO:
- ❌ Leave SSH open to 0.0.0.0/0
- ❌ Commit PEM files to git
- ❌ Expose backend port 3001 publicly
- ❌ Use default passwords
- ❌ Skip system updates
- ❌ Disable firewall
- ❌ Run services as root

---

**🚨 Remember: Security is not optional - it's the foundation of any deployment!**
