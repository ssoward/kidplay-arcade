# Manual AWS EC2 Deployment Guide for KidPlay Arcade

Since automated deployment may have credential issues, here's how to deploy manually using the AWS Console:

## Option 1: AWS Console Manual Deployment

### Step 1: Create EC2 Instance via AWS Console

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2/
2. **Launch Instance**:
   - **Name**: `KidPlay-Arcade-Server`
   - **AMI**: Amazon Linux 2 AMI (HVM) - Kernel 5.10
   - **Instance Type**: t3.micro (free tier eligible)
   - **Key Pair**: Create new or use existing (`kidplay-arcade-key`)
   - **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443), and port 3001

### Step 2: Connect to Instance

```bash
# Download your key pair from AWS Console if new
chmod 400 ~/Downloads/kidplay-arcade-key.pem
mv ~/Downloads/kidplay-arcade-key.pem ~/.ssh/

# Connect to instance (replace with your instance's public IP)
ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@YOUR_INSTANCE_PUBLIC_IP
```

### Step 3: Deploy Application on Instance

Once connected to your EC2 instance, run these commands:

```bash
# Clone the repository
git clone https://github.com/ssoward/kidplay-arcade.git
cd kidplay-arcade

# Run the automated deployment script
chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

The script will automatically:
- ✅ Install Node.js and dependencies
- ✅ Build the React app
- ✅ Configure PM2 process manager
- ✅ Set up nginx reverse proxy
- ✅ Start the application

### Step 4: Update Environment Variables

```bash
# Edit the environment file with your Azure credentials
nano backend/.env

# Update these values:
AZURE_API_KEY=286f8880393d45acb678e890b36f0f6b
AZURE_ENDPOINT=https://familysearch-ai-learning-and-hackathons-proxy.azure-api.net/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview

# Restart the application
pm2 restart kidplay-arcade
```

### Step 5: Access Your Application

Your application will be available at:
- **Main Site**: `http://YOUR_INSTANCE_PUBLIC_IP`
- **API Endpoint**: `http://YOUR_INSTANCE_PUBLIC_IP/api`

## Option 2: Use Pre-built Deployment Package

If you have the deployment package (`kidplay-arcade-deploy-20250614-170641.tar.gz`), you can use it:

```bash
# Upload the package to your EC2 instance
scp -i ~/.ssh/kidplay-arcade-key.pem kidplay-arcade-deploy-20250614-170641.tar.gz ec2-user@YOUR_INSTANCE_PUBLIC_IP:/tmp/

# SSH into the instance and extract
ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@YOUR_INSTANCE_PUBLIC_IP
cd /home/ec2-user
tar -xzf /tmp/kidplay-arcade-deploy-20250614-170641.tar.gz
cd backend && npm install --production
pm2 start server.js --name kidplay-arcade
```

## Security Group Configuration

Make sure your EC2 security group has these inbound rules:

| Port | Protocol | Source    | Description |
|------|----------|-----------|-------------|
| 22   | TCP      | 0.0.0.0/0 | SSH         |
| 80   | TCP      | 0.0.0.0/0 | HTTP        |
| 443  | TCP      | 0.0.0.0/0 | HTTPS       |
| 3001 | TCP      | 0.0.0.0/0 | Node.js App |

## Troubleshooting

### Check Application Status
```bash
pm2 status
pm2 logs kidplay-arcade
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart kidplay-arcade
sudo systemctl restart nginx
```

## Next Steps After Deployment

1. **Test the application** by visiting the public IP
2. **Set up a domain name** (optional) and update DNS
3. **Configure SSL** with Let's Encrypt for HTTPS
4. **Set up monitoring** and backup procedures
5. **Configure auto-scaling** if needed

---

**Current Status**: The application is fully functional with:
- ✅ User authentication and profiles
- ✅ All games working including AI-powered features
- ✅ Production-ready backend with database
- ✅ Optimized React build
- ✅ Proper environment configuration
