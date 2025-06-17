# KidPlay Arcade - Deployment Checklist & Security Guide

## 🔒 Security Checklist

### Before Deployment
- [ ] Remove any hardcoded credentials from source code
- [ ] Ensure `.env` files are in `.gitignore`
- [ ] Use environment variables for all sensitive configuration
- [ ] Test SSH connection to AWS instance
- [ ] Verify SSH key permissions (should be 400)

### Environment Variables to Set on Server
After deployment, SSH to your server and configure these:

```bash
# SSH to your server
ssh -i ~/.ssh/kidplay-arcade-new-key.pem ubuntu@35.175.171.184
cd /var/www/kidplay-arcade

# Edit environment file
nano .env

# Add these required variables:
AZURE_API_KEY=your_actual_api_key_here
AZURE_ENDPOINT=your_actual_endpoint_here

# Restart the backend
pm2 restart kidplay-backend
```

## 🚀 Deployment Process

### 1. Preparation
```bash
# Set environment variables (optional - script has defaults)
export AWS_EC2_IP=35.175.171.184
export AWS_EC2_USER=ubuntu
export SSH_KEY_PATH=$HOME/.ssh/kidplay-arcade-new-key.pem

# Run the improved deployment script
./deploy-improved.sh
```

### 2. Post-Deployment Steps
1. **Configure Environment Variables**: Set AZURE_API_KEY and AZURE_ENDPOINT on server
2. **Test All Endpoints**: Verify health, auth, and AI endpoints
3. **Monitor Logs**: Use `pm2 logs kidplay-backend` to check for errors
4. **Set up Frontend Serving**: Configure nginx or static file serving

### 3. Verification Commands
```bash
# Health check
curl http://35.175.171.184:3001/api/health

# Test CORS
curl -X OPTIONS http://35.175.171.184:3001/api/ask-ai \
  -H "Origin: http://35.175.171.184" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test AI endpoint
curl -X POST http://35.175.171.184:3001/api/ask-ai \
  -H "Content-Type: application/json" \
  -H "Origin: http://35.175.171.184" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"difficulty":"easy"}'
```

## 🛠️ Troubleshooting

### Common Issues

#### CORS Errors
- Ensure ALLOWED_ORIGINS includes your server IP
- Check that frontend requests include proper Origin header
- Verify backend is running with correct environment

#### 500 Internal Server Errors
- Check PM2 logs: `pm2 logs kidplay-backend`
- Verify environment variables are set
- Ensure Azure OpenAI credentials are valid

#### Connection Issues
- Verify AWS Security Group allows traffic on port 3001
- Check SSH key permissions (chmod 400)
- Confirm backend is running: `pm2 status`

### Useful Commands
```bash
# Check backend status
pm2 status

# View logs
pm2 logs kidplay-backend

# Restart backend
pm2 restart kidplay-backend

# View environment variables
pm2 env 0

# Check process details
pm2 show kidplay-backend
```

## 📊 Monitoring

### Health Monitoring
- **Health Endpoint**: `http://35.175.171.184:3001/api/health`
- **PM2 Dashboard**: `pm2 monit`
- **Log Files**: `~/.pm2/logs/`

### Performance Metrics
- Response times should be < 2 seconds
- Memory usage should be stable
- No memory leaks in long-running processes

## 🔄 Updates and Maintenance

### Regular Updates
1. Pull latest code changes
2. Run `./deploy-improved.sh`
3. Monitor logs for any issues
4. Test all game functionalities

### Security Updates
1. Regularly update Node.js and dependencies
2. Monitor for security advisories
3. Keep SSH keys secure and rotated
4. Review access logs periodically

## 📝 Notes

- The improved deployment script handles most common deployment issues
- Environment variables are no longer stored in git for security
- PM2 provides process management and automatic restarts
- Always test deployment in a staging environment first
