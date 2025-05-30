# KidPlay Arcade - AWS EC2 Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Frontend Not Talking to Backend AI

**Symptoms:**
- Frontend loads but AI features don't work
- API calls fail with 404 or connection errors
- Games load but AI assistance is unavailable

**Root Causes & Solutions:**

#### A. Port Mismatch
**Problem:** Backend running on wrong port (3000 vs 3001)
```bash
# Check current backend port
pm2 logs kidplay-arcade | grep "listening on port"

# Fix: Update ecosystem.config.js to use port 3001
sed -i 's/PORT: 3000/PORT: 3001/g' ecosystem.config.js
pm2 restart kidplay-arcade
```

#### B. Nginx Configuration Issues
**Problem:** nginx not properly proxying API requests
```bash
# Check nginx configuration
sudo nginx -t

# View current config
cat /etc/nginx/conf.d/kidplay-arcade.conf

# Fix: Ensure API location block exists
location /api/ {
    proxy_pass http://localhost:3001;
    # ... other proxy settings
}

# Restart nginx
sudo systemctl restart nginx
```

#### C. File Permission Issues
**Problem:** nginx can't access build files (403/500 errors)
```bash
# Fix permissions
chmod 755 /home/ec2-user
chmod -R 755 /home/ec2-user/kidplay-arcade/build

# Restart nginx
sudo systemctl restart nginx
```

### 2. Node.js Installation Issues

**Problem:** GLIBC compatibility errors
```bash
# Error: requires glibc >= 2.28
# Solution: Use Node.js 16.20.2 instead of 18+

# Check current GLIBC version
ldd --version

# Install compatible Node.js version
nvm install 16.20.2
nvm use 16.20.2
```

### 3. Service Status Checks

```bash
# Check all services
pm2 status
sudo systemctl status nginx

# Check logs
pm2 logs kidplay-arcade
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 4. Network Connectivity Issues

```bash
# Test internal connectivity
curl -I http://localhost:3001/api/
curl -I http://localhost:80

# Test external connectivity
curl -I http://YOUR_PUBLIC_IP

# Check security groups allow ports 80, 443, 22
```

### 5. Environment Variables

**Problem:** Missing or incorrect Azure credentials
```bash
# Check current env
cat .env

# Update with real credentials
nano .env

# Restart backend
pm2 restart kidplay-arcade
```

### 6. Complete Reset Procedure

If all else fails, here's a complete reset:

```bash
# Stop all services
pm2 delete all
sudo systemctl stop nginx

# Clean up
rm -rf node_modules backend/node_modules
rm -rf build logs

# Reinstall
npm install
cd backend && npm install && cd ..
npm run build

# Restart services
pm2 start ecosystem.config.js
sudo systemctl start nginx
```

## Verification Steps

After fixing issues, verify the deployment:

```bash
# 1. Check backend is running
curl http://localhost:3001 | head

# 2. Check frontend loads
curl http://localhost | grep -o '<title>[^<]*'

# 3. Check API proxy works
curl -X POST http://localhost/api/ask-ai \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'

# 4. Check external access
curl http://YOUR_PUBLIC_IP | grep -o '<title>[^<]*'
```

## Performance Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# Check resource usage
htop

# View detailed logs
pm2 logs kidplay-arcade --lines 50
```

## Emergency Contacts & Resources

- **EC2 Instance Logs:** `/var/log/cloud-init-output.log`
- **PM2 Home:** `~/.pm2/`
- **Nginx Config:** `/etc/nginx/conf.d/`
- **Application Files:** `/home/ec2-user/kidplay-arcade/`

## Success Indicators

✅ **Working Deployment Should Show:**
- PM2 status: 2 instances online
- nginx status: active (running)
- Frontend title: "PlayHub Arcade"
- API responds with proper error format
- Public IP accessible externally
