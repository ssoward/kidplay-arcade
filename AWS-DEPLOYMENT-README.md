# 🚀 KidPlay Arcade - AWS Deployment Guide

Deploy your KidPlay Arcade to AWS in minutes!

## � AWS Region Configuration
**Important**: All KidPlay Arcade infrastructure uses **us-east-2 (Ohio)** region for consistency and optimal performance.

## �🎯 Quick Start (Recommended)

**One-command deployment:**
```bash
./deploy-to-new-ec2.sh [IP_ADDRESS]
```

This script will:
- ✅ Connect to your EC2 instance in us-east-2
- ✅ Deploy your KidPlay Arcade app
- ✅ Set up nginx and backend services with AI endpoints
- ✅ Configure proper security and performance settings
- ✅ Give you a working URL with full AI functionality

**Total time: ~5 minutes**

## 📋 Prerequisites

1. **AWS CLI installed and configured:**
   ```bash
   brew install awscli
   aws configure
   ```

2. **Node.js installed:**
   ```bash
   brew install node
   ```

3. **This repository cloned and dependencies installed:**
   ```bash
   git clone https://github.com/ssoward/kidplay-arcade.git
   cd kidplay-arcade
   npm install
   ```

## 🎮 After Deployment

Once `./deploy-simple.sh` completes, you'll get:

- **🌐 Your live app:** `http://YOUR-IP-ADDRESS`
- **🔧 Management script:** `./aws-manage.sh`

### Management Commands:
```bash
./aws-manage.sh ssh        # Connect to your server
./aws-manage.sh stop       # Stop instance (saves money)
./aws-manage.sh start      # Start stopped instance  
./aws-manage.sh terminate  # Delete everything
```

## 💰 Cost Information

- **Instance type:** t3.micro (free tier eligible)
- **Estimated cost:** ~$8-10/month if running 24/7
- **Save money:** Use `./aws-manage.sh stop` when not using

## 🛠️ Advanced Options

### Full-Featured Deployment
For advanced features and monitoring:
```bash
./create-aws-complete.sh
```

### Manual Instance Creation
Step-by-step with more control:
```bash
./create-aws-instance.sh
```

## 🆘 Troubleshooting

### Common Issues:

1. **"AWS CLI not configured"**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret, and region
   ```

2. **"Node.js not found"**
   ```bash
   brew install node
   ```

3. **"Permission denied"**
   ```bash
   chmod +x deploy-simple.sh
   ./deploy-simple.sh
   ```

4. **Instance not responding:**
   - Wait 2-3 minutes for full startup
   - Check AWS console for instance status
   - Try: `./aws-manage.sh ssh`

### Getting Help:

- **Check instance status:** AWS Console > EC2 > Instances
- **View logs:** `./aws-manage.sh ssh` then `pm2 logs`
- **Restart services:** SSH in and run `pm2 restart all && sudo systemctl restart nginx`

## 🎯 What Gets Deployed

Your deployment includes:
- ✅ React frontend (built and optimized)
- ✅ Node.js backend API  
- ✅ SQLite database
- ✅ Nginx web server
- ✅ PM2 process manager
- ✅ Auto-restart on reboot
- ✅ Security group configured
- ✅ All games and features working

## 🌟 Quick Demo

After deployment, test these features:
1. **Visit your URL:** `http://YOUR-IP`
2. **Play Song Quiz:** Try the Disney genre
3. **Create account:** Test user registration
4. **Play games:** Sight words, math, memory
5. **AI Chat:** Ask for help or stories

## 🔄 Updates

To deploy updates to your live instance:
1. Make your code changes
2. Run `./deploy-simple.sh` again
3. It will update your existing instance

---

**🎉 Ready to deploy? Just run: `./deploy-simple.sh`**
