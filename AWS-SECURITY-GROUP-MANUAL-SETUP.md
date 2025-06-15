# AWS Security Group Manual Configuration Guide

## Issue
The KidPlay Arcade server is running successfully on AWS EC2 (IP: 3.81.165.163) but external access to port 3001 is blocked due to security group configuration.

## Quick Fix - AWS Console Method

### Step 1: Access AWS Console
1. Go to https://aws.amazon.com/console/
2. Sign in to your AWS account
3. Navigate to **EC2 Dashboard**

### Step 2: Find Your Instance
1. In the EC2 Dashboard, click **"Instances"** in the left sidebar
2. Look for the instance with **Public IPv4**: `3.81.165.163`
3. Click on the **Instance ID** to view details

### Step 3: Configure Security Group
1. In the instance details, scroll down to the **"Security"** tab
2. Click on the **Security Group** name (it will be a link)
3. In the Security Groups page, click **"Edit inbound rules"**
4. Click **"Add rule"**
5. Configure the new rule:
   - **Type**: Custom TCP
   - **Port range**: 3001
   - **Source**: 0.0.0.0/0 (Anywhere IPv4)
   - **Description**: KidPlay Arcade Web Server
6. Click **"Save rules"**

### Step 4: Verify Access
After saving the rule, wait 1-2 minutes for propagation, then test:
```bash
curl "http://3.81.165.163:3001/api/health"
```

Expected response:
```json
{"status":"OK","message":"KidPlay Arcade API is running","timestamp":"2025-06-04T..."}
```

## Alternative Method - AWS CLI (If Credentials Are Fixed)

If you fix your AWS credentials, you can use the automated script:

```bash
# First, reconfigure AWS CLI with valid credentials
aws configure

# Then run the security group configuration script
./configure-aws-security-group.sh
```

## Verification Commands

Once the security group is configured, test these endpoints:

```bash
# Health check
curl "http://3.81.165.163:3001/api/health"

# Test user registration
curl -X POST "http://3.81.165.163:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'

# Test login
curl -X POST "http://3.81.165.163:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"scott.soward@gmail.com","password":"admin123"}'
```

## Security Considerations

⚠️ **Important**: Opening port 3001 to 0.0.0.0/0 (anywhere) allows global access. Consider these security improvements:

1. **Restrict Source IP**: Instead of 0.0.0.0/0, use your specific IP or IP range
2. **Use Application Load Balancer**: Route traffic through ALB with SSL termination
3. **Enable HTTPS**: Configure SSL/TLS certificates
4. **Implement Rate Limiting**: Add rate limiting middleware

## Troubleshooting

### If Server Still Not Accessible After Security Group Fix

1. **Check Server Status**:
   ```bash
   ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com "pm2 list"
   ```

2. **Check Server Logs**:
   ```bash
   ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com "pm2 logs kidplay-arcade --lines 20"
   ```

3. **Restart Server**:
   ```bash
   ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com "pm2 restart kidplay-arcade"
   ```

4. **Check Database**:
   ```bash
   ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com "cd ~/kidplay-arcade && node backend/test-db-auth.js"
   ```

### If SSH Connection Fails

The SSH key might need proper permissions:
```bash
chmod 400 ~/.ssh/kidplay-arcade-key.pem
```

## Next Steps After Security Group Fix

1. **Test all authentication endpoints**
2. **Update frontend to use production server**
3. **Configure proper SSL/HTTPS**
4. **Set up monitoring and logging**
5. **Implement backup procedures**

## Expected Results

Once configured correctly, you should be able to:
- Access the server at `http://3.81.165.163:3001`
- Use all authentication endpoints
- Connect your React frontend to the production backend
- Register new users and authenticate existing ones

The database authentication system is fully implemented and deployed - we just need to open the network access.
