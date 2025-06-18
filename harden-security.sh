#!/bin/bash

# KidPlay Arcade - Automated Security Hardening Script
# Run this on your Amazon Linux 2023 instance after deployment

set -e

echo "🔒 KidPlay Arcade - Security Hardening"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as ec2-user
if [ "$USER" != "ec2-user" ]; then
    print_error "This script should be run as ec2-user, not root"
    exit 1
fi

echo "Starting security hardening process..."
echo ""

# 1. System Updates
echo "1. 🔄 Updating System Packages..."
sudo dnf update -y
print_status "System packages updated"

# 2. SSH Hardening
echo ""
echo "2. 🔐 Hardening SSH Configuration..."

# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Apply SSH security settings
sudo tee /tmp/ssh_security.conf > /dev/null << 'EOF'
# Disable password authentication
PasswordAuthentication no
PermitEmptyPasswords no

# Disable root login
PermitRootLogin no

# Enable key-based authentication
PubkeyAuthentication yes

# Disable X11 forwarding
X11Forwarding no

# Disable unused authentication methods
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

# Connection limits
MaxAuthTries 3
MaxSessions 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable TCP forwarding for security
AllowTcpForwarding no
AllowAgentForwarding no

# Only allow ec2-user
AllowUsers ec2-user
EOF

# Apply SSH configuration
sudo cat /tmp/ssh_security.conf >> /etc/ssh/sshd_config
sudo systemctl restart sshd
print_status "SSH hardened and restarted"

# 3. Firewall Configuration
echo ""
echo "3. 🛡️  Configuring Firewall..."

# Install and enable firewalld
sudo dnf install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Create custom zone
sudo firewall-cmd --permanent --new-zone=kidplay 2>/dev/null || true
sudo firewall-cmd --permanent --zone=kidplay --set-target=DROP

# Allow necessary services
sudo firewall-cmd --permanent --zone=kidplay --add-service=ssh
sudo firewall-cmd --permanent --zone=kidplay --add-service=http
sudo firewall-cmd --permanent --zone=kidplay --add-service=https

# Block backend port from external access (only allow localhost)
sudo firewall-cmd --permanent --zone=kidplay --add-rich-rule='
  rule family="ipv4" 
  source address="127.0.0.1" 
  port port="3001" protocol="tcp" 
  accept'

# Set as default zone
sudo firewall-cmd --set-default-zone=kidplay
sudo firewall-cmd --reload

print_status "Firewall configured with restrictive rules"

# 4. Install and Configure Fail2ban
echo ""
echo "4. 🚫 Setting up Fail2ban..."

# Install EPEL and fail2ban
sudo dnf install -y epel-release
sudo dnf install -y fail2ban

# Configure fail2ban
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

print_status "Fail2ban configured and active"

# 5. Install Security Monitoring Tools
echo ""
echo "5. 📊 Installing Security Monitoring..."

# Install auditd for system monitoring
sudo dnf install -y audit
sudo systemctl enable auditd
sudo systemctl start auditd

# Configure audit rules
sudo tee /etc/audit/rules.d/kidplay.rules > /dev/null << 'EOF'
# Monitor authentication events
-w /var/log/secure -p wa -k auth_events
-w /etc/passwd -p wa -k passwd_changes
-w /etc/group -p wa -k group_changes
-w /etc/shadow -p wa -k shadow_changes

# Monitor configuration changes
-w /etc/ssh/sshd_config -p wa -k ssh_config
-w /etc/nginx/ -p wa -k nginx_config

# Monitor application files
-w /home/ec2-user/backend/ -p wa -k app_changes
-w /var/www/html/ -p wa -k web_changes

# Monitor system calls
-a always,exit -F arch=b64 -S execve -k exec_commands
EOF

sudo service auditd restart
print_status "System auditing configured"

# 6. Secure File Permissions
echo ""
echo "6. 📁 Setting Secure File Permissions..."

# Secure application files
if [ -d "/home/ec2-user/backend" ]; then
    chmod 755 /home/ec2-user/backend
    if [ -f "/home/ec2-user/backend/.env.production" ]; then
        chmod 600 /home/ec2-user/backend/.env.production
    fi
    if [ -f "/home/ec2-user/backend/kidplay_arcade.db" ]; then
        chmod 600 /home/ec2-user/backend/kidplay_arcade.db
    fi
fi

# Create secure backup directory
mkdir -p /home/ec2-user/backups
chmod 700 /home/ec2-user/backups

# Secure web files
if [ -d "/var/www/html" ]; then
    sudo chown -R nginx:nginx /var/www/html
    sudo find /var/www/html -type f -exec chmod 644 {} \;
    sudo find /var/www/html -type d -exec chmod 755 {} \;
fi

print_status "File permissions secured"

# 7. Configure Log Rotation
echo ""
echo "7. 📋 Configuring Log Rotation..."

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
        if /bin/systemctl is-active nginx > /dev/null; then
            /bin/systemctl reload nginx
        fi
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
    postrotate
        if /bin/systemctl is-active pm2-ec2-user > /dev/null; then
            su ec2-user -c "pm2 reloadLogs"
        fi
    endscript
}
EOF

print_status "Log rotation configured"

# 8. Install Security Headers for Nginx
echo ""
echo "8. 🔒 Configuring Nginx Security Headers..."

# Create security headers configuration
sudo tee /etc/nginx/conf.d/security-headers.conf > /dev/null << 'EOF'
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Hide server information
server_tokens off;
more_clear_headers Server;

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=5r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
EOF

# Update main nginx config to include security headers
if [ -f "/etc/nginx/conf.d/kidplay.conf" ]; then
    sudo sed -i '/server {/a\    include /etc/nginx/conf.d/security-headers.conf;' /etc/nginx/conf.d/kidplay.conf
fi

sudo systemctl reload nginx 2>/dev/null || print_warning "Nginx not running - will apply on start"
print_status "Nginx security headers configured"

# 9. Create Security Scripts
echo ""
echo "9. 📜 Creating Security Management Scripts..."

# Security check script
cat > /home/ec2-user/security-check.sh << 'EOF'
#!/bin/bash
echo "🔒 KidPlay Arcade Security Status Check"
echo "======================================="

echo "1. SSH Configuration:"
echo "   - Password auth: $(sudo grep PasswordAuthentication /etc/ssh/sshd_config | grep -v '#')"
echo "   - Root login: $(sudo grep PermitRootLogin /etc/ssh/sshd_config | grep -v '#')"

echo ""
echo "2. Firewall Status:"
sudo firewall-cmd --list-all-zones | grep -A 10 "kidplay"

echo ""
echo "3. Fail2ban Status:"
sudo fail2ban-client status

echo ""
echo "4. Active Network Connections:"
sudo netstat -tulpn | grep LISTEN

echo ""
echo "5. Recent Authentication Attempts:"
sudo tail -10 /var/log/secure

echo ""
echo "6. File Permissions Check:"
ls -la /home/ec2-user/backend/.env* 2>/dev/null || echo "No .env files found"
ls -la /home/ec2-user/backend/*.db 2>/dev/null || echo "No database files found"
EOF

chmod +x /home/ec2-user/security-check.sh

# Daily security update script
cat > /home/ec2-user/daily-security-update.sh << 'EOF'
#!/bin/bash
# Daily security maintenance script

echo "$(date): Starting daily security maintenance" >> /var/log/security-maintenance.log

# Update system packages
sudo dnf update -y --security

# Check for failed login attempts
FAILED_LOGINS=$(sudo grep "Failed password" /var/log/secure | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "WARNING: $FAILED_LOGINS failed login attempts detected" >> /var/log/security-maintenance.log
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%" >> /var/log/security-maintenance.log
fi

echo "$(date): Security maintenance completed" >> /var/log/security-maintenance.log
EOF

chmod +x /home/ec2-user/daily-security-update.sh

# Add to cron for daily execution
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/daily-security-update.sh") | crontab -

print_status "Security management scripts created"

# 10. Install Additional Security Tools
echo ""
echo "10. 🛠️  Installing Additional Security Tools..."

# Install ClamAV antivirus
sudo dnf install -y clamav clamd clamav-update
sudo freshclam
print_status "ClamAV antivirus installed"

# Install AIDE (Advanced Intrusion Detection Environment)
sudo dnf install -y aide
sudo aide --init
sudo mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
print_status "AIDE intrusion detection installed"

# 11. Create Incident Response Plan
echo ""
echo "11. 📋 Creating Incident Response Plan..."

cat > /home/ec2-user/incident-response.md << 'EOF'
# KidPlay Arcade - Security Incident Response Plan

## Immediate Response Steps

### 1. Suspected Breach
```bash
# Immediately check active connections
sudo netstat -tulpn
sudo ss -tulpn

# Check recent logins
sudo last -n 20
sudo grep "Accepted\|Failed" /var/log/secure | tail -20

# Check running processes
ps aux | grep -v "^ec2-user\|^root\|^nginx"

# Check system integrity
sudo aide --check
```

### 2. If Compromise Confirmed
```bash
# Isolate the instance
sudo firewall-cmd --panic-on

# Capture evidence
sudo cp /var/log/secure /tmp/security-incident-$(date +%s).log
sudo tar -czf /tmp/incident-logs-$(date +%s).tar.gz /var/log/

# Create snapshot for forensics
aws ec2 create-snapshot --volume-id vol-xxxxxxxxx --description "Security incident snapshot"
```

### 3. Recovery Steps
1. Restore from clean backup/AMI
2. Apply all security patches
3. Change all passwords/keys
4. Review and strengthen security configuration
5. Monitor for reoccurrence

## Emergency Contacts
- AWS Support: aws support create-case
- Security Team: [Your security contact]
- Incident Commander: [Your incident lead]
EOF

print_status "Incident response plan created"

echo ""
echo "🎯 Security Hardening Summary:"
echo "=============================="
print_status "SSH access secured and hardened"
print_status "Firewall configured with restrictive rules"
print_status "Fail2ban active for intrusion prevention"
print_status "System auditing and monitoring enabled"
print_status "File permissions secured"
print_status "Log rotation configured"
print_status "Security headers applied to web server"
print_status "Daily security maintenance scheduled"
print_status "Antivirus and intrusion detection installed"
print_status "Incident response plan created"

echo ""
echo "📋 Next Steps:"
echo "1. Run: ./security-check.sh to verify configuration"
echo "2. Configure SSL/HTTPS certificate"
echo "3. Set up external log monitoring"
echo "4. Schedule regular security audits"
echo "5. Test incident response procedures"

echo ""
print_warning "IMPORTANT: Reboot the system to ensure all changes take effect"
print_warning "Command: sudo reboot"

echo ""
echo "🔒 Security hardening completed successfully!"
