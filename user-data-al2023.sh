#!/bin/bash

# AWS EC2 User Data Script for KidPlay Arcade Auto-Setup (Amazon Linux 2023)
# This script runs automatically when the instance first boots

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting KidPlay Arcade auto-setup on Amazon Linux 2023..."

# Update system
dnf update -y

# Install required packages
dnf install -y git nginx sqlite

# Install Node.js 18 (Amazon Linux 2023 has better Node.js support)
dnf install -y nodejs npm

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally
npm install -g pm2

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Create ec2-user directory structure
mkdir -p /home/ec2-user
chown ec2-user:ec2-user /home/ec2-user

echo "KidPlay Arcade auto-setup complete on Amazon Linux 2023!"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 installed: $(which pm2)"
echo "Nginx status: $(systemctl is-active nginx)"
