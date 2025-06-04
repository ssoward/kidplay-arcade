#!/bin/bash

# AWS EC2 User Data Script for KidPlay Arcade Auto-Setup
# This script runs automatically when the instance first boots

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting KidPlay Arcade auto-setup..."

# Update system
yum update -y

# Install Git
yum install -y git

# Install Node.js via NVM for ec2-user
sudo -u ec2-user bash << 'EOF'
cd /home/ec2-user
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Install PM2 globally
npm install -g pm2

# Create PM2 startup script
pm2 startup
EOF

# Install nginx
yum install -y nginx
systemctl enable nginx

# Install SQLite (for the database)
yum install -y sqlite sqlite-devel

echo "KidPlay Arcade auto-setup complete!"
