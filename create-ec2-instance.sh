#!/bin/bash

# Create new EC2 instance for KidPlay Arcade deployment
# This script creates a new EC2 instance and deploys the application

set -e

echo "🚀 Creating new EC2 instance for KidPlay Arcade..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_TYPE="t3.micro"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2
KEY_NAME="kidplay-arcade-key"
SECURITY_GROUP_NAME="kidplay-arcade-sg"
REGION="us-east-1"

echo -e "${BLUE}Step 1: Creating Security Group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for KidPlay Arcade" \
    --query 'GroupId' \
    --output text \
    --region "$REGION" 2>/dev/null || echo "exists")

if [ "$SECURITY_GROUP_ID" != "exists" ]; then
    echo -e "${GREEN}✅ Security Group created: $SECURITY_GROUP_ID${NC}"
    
    # Add SSH rule
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    # Add HTTP rule
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    # Add HTTPS rule
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    # Add Node.js app port rule
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 3001 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
        
    echo -e "${GREEN}✅ Security Group rules added${NC}"
else
    echo -e "${YELLOW}⚠️  Security Group already exists, retrieving ID...${NC}"
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --group-names "$SECURITY_GROUP_NAME" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region "$REGION")
    echo -e "${GREEN}✅ Using existing Security Group: $SECURITY_GROUP_ID${NC}"
fi

echo -e "${BLUE}Step 2: Creating Key Pair...${NC}"
if [ ! -f "~/.ssh/${KEY_NAME}.pem" ]; then
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --query 'KeyMaterial' \
        --output text \
        --region "$REGION" > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo -e "${GREEN}✅ Key pair created and saved to ~/.ssh/${KEY_NAME}.pem${NC}"
else
    echo -e "${GREEN}✅ Key pair already exists${NC}"
fi

echo -e "${BLUE}Step 3: Creating EC2 Instance...${NC}"

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y git nginx

# Install Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Install PM2
npm install -g pm2

# Clone the repository
cd /home/ec2-user
git clone https://github.com/ssoward/kidplay-arcade.git
chown -R ec2-user:ec2-user kidplay-arcade

# Setup as ec2-user
sudo -u ec2-user bash << 'USEREOF'
cd /home/ec2-user/kidplay-arcade
npm install
cd backend && npm install --production && cd ..
npm run build

# Setup environment
cp .env.production backend/.env

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
PMEOF

# Start the application
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
USEREOF

# Configure nginx
cat > /etc/nginx/conf.d/kidplay-arcade.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    
    location / {
        try_files $uri $uri/ @backend;
    }
    
    location @backend {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Start nginx
systemctl enable nginx
systemctl start nginx

# Create status file
echo "KidPlay Arcade deployed successfully at $(date)" > /home/ec2-user/deployment-status.txt
EOF

# Launch the instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP_ID" \
    --user-data file://user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=KidPlay-Arcade-Server}]' \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region "$REGION")

echo -e "${GREEN}✅ EC2 Instance launched: $INSTANCE_ID${NC}"

echo -e "${BLUE}Step 4: Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region "$REGION")

echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"
echo -e "${BLUE}Instance ID: $INSTANCE_ID${NC}"
echo -e "${BLUE}Public IP: $PUBLIC_IP${NC}"
echo -e "${BLUE}SSH Command: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$PUBLIC_IP${NC}"
echo -e "${BLUE}Website URL: http://$PUBLIC_IP${NC}"
echo ""
echo -e "${YELLOW}⏳ The application is being deployed automatically...${NC}"
echo -e "${YELLOW}⏳ This process takes about 5-10 minutes.${NC}"
echo -e "${YELLOW}⏳ You can monitor progress by SSH-ing into the instance.${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Wait 5-10 minutes for deployment to complete"
echo -e "2. Visit http://$PUBLIC_IP to access your application"
echo -e "3. SSH into the instance to check logs: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo -e "4. Check deployment status: cat /home/ec2-user/deployment-status.txt"

# Cleanup
rm -f user-data.sh

# Save deployment info
cat > deployment-info.txt << EOF
KidPlay Arcade Deployment Information
====================================
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
SSH Command: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$PUBLIC_IP
Website URL: http://$PUBLIC_IP
Key Pair: $KEY_NAME
Security Group: $SECURITY_GROUP_NAME ($SECURITY_GROUP_ID)
Region: $REGION
EOF

echo -e "${GREEN}✅ Deployment information saved to deployment-info.txt${NC}"
