# Create New EC2 Instance - Step by Step Guide

## AWS Console Steps

### 1. Delete Current Instance
1. Go to AWS EC2 Console
2. Find instance with IP `3.145.53.146`
3. Terminate the instance
4. Delete associated security group if needed

### 2. Create New EC2 Instance
1. **Launch Instance**
   - Name: `kidplay-arcade-new`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t3.micro (or t2.micro for free tier)
   - Architecture: 64-bit (x86)
   - **Region: us-east-2 (Ohio)** - IMPORTANT: Use this region for all KidPlay resources

2. **Key Pair**
   - Create new key pair
   - Name: `kidplay-arcade-new-key`
   - Type: RSA
   - Format: .pem
   - **IMPORTANT**: Download and save the .pem file to `~/.ssh/kidplay-arcade-new-key.pem`

3. **Network Settings**
   - VPC: Default
   - Subnet: Default (any availability zone)
   - Auto-assign public IP: Enable
   - Security Group: Create new
     - Name: `kidplay-arcade-sg`
     - Rules:
       - SSH (22): Your IP
       - HTTP (80): 0.0.0.0/0
       - HTTPS (443): 0.0.0.0/0
       - Custom TCP (3001): 0.0.0.0/0 (for backend API)

4. **Storage**
   - 8 GB gp3 (default is fine)

5. **Launch Instance**

### 3. After Instance Creation
1. Note the new public IP address
2. Update the deploy script with the new IP
3. Set proper permissions on the PEM key:
   ```bash
   chmod 400 ~/.ssh/kidplay-arcade-new-key.pem
   ```

## Automated Deployment
Once the instance is ready, run:
```bash
./deploy-to-new-ec2.sh [NEW_IP_ADDRESS]
```

## Manual Steps if Needed
1. Connect to instance: `ssh -i ~/.ssh/kidplay-arcade-new-key.pem ubuntu@[NEW_IP]`
2. Follow the deployment script steps manually
