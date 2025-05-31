# Quick Deployment Commands for AWS EC2

## Copy and paste these commands on your EC2 instance:

```bash
# Navigate to project directory and pull latest changes
cd kidplay-arcade && git pull origin main

# Run the deployment script
./deploy-aws-ec2.sh
```

## If this is the first deployment:

```bash
# Clone the repository
git clone https://github.com/ssoward/kidplay-arcade.git
cd kidplay-arcade

# Run the deployment script
chmod +x deploy-aws-ec2.sh
./deploy-aws-ec2.sh
```

## What the deployment script does:

1. ✅ Updates system packages
2. ✅ Installs Node.js and npm
3. ✅ Installs project dependencies
4. ✅ Builds the React production version
5. ✅ Installs and configures PM2 process manager
6. ✅ Starts the backend server on port 3001
7. ✅ Configures nginx to serve the frontend and proxy API calls
8. ✅ Sets up SSL with Let's Encrypt (if domain is configured)

## After deployment:

- **Frontend**: Available at http://your-ec2-ip or https://your-domain.com
- **Backend API**: Available at http://your-ec2-ip:3001/api or proxied through nginx
- **Process Management**: `pm2 status` to check running processes

## Troubleshooting:

- Check logs: `pm2 logs`
- Restart services: `pm2 restart all`
- Check nginx: `sudo systemctl status nginx`
- View nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

🎉 **Your Trivia Blitz game with AI question generation is now ready for production!**
