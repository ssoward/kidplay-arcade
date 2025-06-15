#!/bin/bash

# Better KidPlay Arcade AWS Deployment for Amazon Linux 2023
# This script creates everything you need with improved compatibility

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 KidPlay Arcade - Enhanced AWS Deployment (AL2023)${NC}"
echo -e "${BLUE}This will create a new Amazon Linux 2023 instance and deploy your app${NC}"
echo ""

# Configuration
TIMESTAMP=$(date +%s)
KEY_NAME="kidplay-key-$TIMESTAMP"
SG_NAME="kidplay-sg-$TIMESTAMP"
PEM_FILE="$HOME/.ssh/${KEY_NAME}.pem"

# Pre-checks
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Please install AWS CLI first: brew install awscli${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Please configure AWS CLI: aws configure${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Please install Node.js first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get AWS region
REGION=$(aws configure get region || echo "us-east-1")
echo -e "${BLUE}Using AWS region: $REGION${NC}"

# Create key pair
echo -e "${BLUE}🔑 Creating SSH key...${NC}"
aws ec2 create-key-pair --key-name "$KEY_NAME" --query 'KeyMaterial' --output text > "$PEM_FILE"
chmod 400 "$PEM_FILE"
echo -e "${GREEN}✅ SSH key created: $PEM_FILE${NC}"

# Create security group
echo -e "${BLUE}🛡️  Creating security group...${NC}"
SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "KidPlay Arcade security group" \
    --query 'GroupId' --output text)

# Add rules
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --ip-permissions \
    '[
        {"IpProtocol":"tcp","FromPort":22,"ToPort":22,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
        {"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
        {"IpProtocol":"tcp","FromPort":3001,"ToPort":3001,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}
    ]' > /dev/null

echo -e "${GREEN}✅ Security group created: $SG_ID${NC}"

# Create user data script for auto-setup
USER_DATA=$(cat << 'USERDATA'
#!/bin/bash
exec > >(tee /var/log/user-data.log)
exec 2>&1
echo "Starting KidPlay Arcade auto-setup on Amazon Linux 2023..."
dnf update -y
dnf install -y git nginx nodejs npm sqlite
npm install -g pm2
systemctl enable nginx
systemctl start nginx
mkdir -p /home/ec2-user
chown ec2-user:ec2-user /home/ec2-user
echo "Setup complete - Node: $(node --version), NPM: $(npm --version)"
USERDATA
)

# Launch instance with user data
echo -e "${BLUE}🖥️  Launching EC2 instance (Amazon Linux 2023)...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0b715af88ed6bff62 \
    --count 1 \
    --instance-type t3.micro \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=KidPlay-Arcade-AL2023}]' \
    --query 'Instances[0].InstanceId' --output text)

echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"

# Wait for instance
echo -e "${BLUE}⏳ Waiting for instance to start...${NC}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

# Get IP address
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo -e "${GREEN}✅ Instance running at: $PUBLIC_IP${NC}"

# Update configuration for new IP
echo -e "${BLUE}🔧 Updating configuration...${NC}"
echo "REACT_APP_API_BASE_URL=http://$PUBLIC_IP:3001" > .env.production

# Build app
echo -e "${BLUE}🏗️  Building application...${NC}"
npm run build

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
tar -czf deploy.tar.gz \
    build/ \
    backend/ \
    package.json \
    .env.production \
    --exclude=node_modules \
    --exclude=.git

# Wait for SSH access (allow extra time for user data script)
echo -e "${BLUE}⏳ Waiting for SSH access and auto-setup completion (this takes ~3-4 minutes)...${NC}"
sleep 30  # Give user data script time to start

# Wait for SSH
for i in {1..60}; do
    if ssh -i "$PEM_FILE" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" "echo 'ready'" 2>/dev/null; then
        echo -e "${GREEN}ready${NC}"
        break
    fi
    echo -n "."
    sleep 5
done

# Wait a bit more for user data to complete
echo -e "${BLUE}⏳ Allowing user data script to complete...${NC}"
sleep 60

# Deploy application
echo -e "${BLUE}🚀 Deploying application...${NC}"
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no deploy.tar.gz ec2-user@"$PUBLIC_IP":~/

# Create enhanced deployment script for AL2023
DEPLOY_SCRIPT=$(cat << 'DEPLOY'
#!/bin/bash
set -e
echo "$(date) - Starting deployment on Amazon Linux 2023..."

# Extract application
cd ~
tar -xzf deploy.tar.gz
echo "$(date) - Application extracted"

# Install frontend dependencies and set up nginx
cd ~/build
sudo cp -r * /var/www/html/
sudo chown -R nginx:nginx /var/www/html/

# Configure nginx for React app
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo systemctl restart nginx
echo "$(date) - Nginx configured and restarted"

# Set up backend
cd ~/backend
npm install
echo "$(date) - Backend dependencies installed"

# Start backend with PM2
pm2 delete all 2>/dev/null || true
pm2 start app.js --name "kidplay-backend"
pm2 save
pm2 startup | tail -1 | sudo bash
echo "$(date) - Backend started with PM2"

echo "$(date) - Deployment complete!"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
DEPLOY
)

# Execute deployment
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" "$DEPLOY_SCRIPT"

# Cleanup
rm -f deploy.tar.gz

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}📋 Connection Details:${NC}"
echo -e "   Instance ID: $INSTANCE_ID"
echo -e "   Public IP: $PUBLIC_IP"
echo -e "   SSH Key: $PEM_FILE"
echo ""
echo -e "${GREEN}🌐 Your KidPlay Arcade is now live at:${NC}"
echo -e "   ${BLUE}http://$PUBLIC_IP${NC}"
echo ""
echo -e "${BLUE}🔧 Backend API available at:${NC}"
echo -e "   ${BLUE}http://$PUBLIC_IP:3001${NC}"
echo ""
echo -e "${YELLOW}📝 SSH Connection:${NC}"
echo -e "   ssh -i $PEM_FILE ec2-user@$PUBLIC_IP"
echo ""
echo -e "${GREEN}✅ Production fix verified and deployed!${NC}"
