#!/bin/bash

# Create AWS EC2 Instance and Deploy KidPlay Arcade
# This script will:
# 1. Create a new key pair and PEM file
# 2. Create a security group with proper rules
# 3. Launch an EC2 instance
# 4. Deploy the KidPlay Arcade application

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
KEY_NAME="kidplay-arcade-new-key"
PEM_PATH="$HOME/.ssh/${KEY_NAME}.pem"
SECURITY_GROUP_NAME="kidplay-arcade-sg"
INSTANCE_TYPE="t2.micro"  # Free tier eligible
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI (us-east-1)
REGION="us-east-1"

echo -e "${GREEN}🚀 Creating AWS Infrastructure for KidPlay Arcade...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first:${NC}"
    echo "brew install awscli"
    echo "Then configure it with: aws configure"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run: aws configure${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current AWS Identity:${NC}"
aws sts get-caller-identity

# Step 1: Create Key Pair
echo -e "\n${BLUE}🔑 Step 1: Creating Key Pair...${NC}"

# Delete existing key pair if it exists
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION" 2>/dev/null || true

# Remove existing PEM file
rm -f "$PEM_PATH"

# Create new key pair
aws ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --region "$REGION" \
    --query 'KeyMaterial' \
    --output text > "$PEM_PATH"

if [ $? -eq 0 ]; then
    chmod 400 "$PEM_PATH"
    echo -e "${GREEN}✅ Key pair created: $PEM_PATH${NC}"
else
    echo -e "${RED}❌ Failed to create key pair${NC}"
    exit 1
fi

# Step 2: Create Security Group
echo -e "\n${BLUE}🛡️  Step 2: Creating Security Group...${NC}"

# Delete existing security group if it exists
EXISTING_SG=$(aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$REGION" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)
if [ "$EXISTING_SG" != "None" ] && [ "$EXISTING_SG" != "" ]; then
    echo -e "${YELLOW}⚠️  Deleting existing security group...${NC}"
    aws ec2 delete-security-group --group-id "$EXISTING_SG" --region "$REGION" 2>/dev/null || true
    sleep 5
fi

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for KidPlay Arcade application" \
    --region "$REGION" \
    --query 'GroupId' \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Security group created: $SECURITY_GROUP_ID${NC}"
else
    echo -e "${RED}❌ Failed to create security group${NC}"
    exit 1
fi

# Add security group rules
echo -e "${BLUE}🔒 Adding security group rules...${NC}"

# SSH (port 22)
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

# HTTP (port 80)
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

# HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

# Backend API (port 3001)
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

echo -e "${GREEN}✅ Security group rules added${NC}"

# Step 3: Launch EC2 Instance
echo -e "\n${BLUE}🖥️  Step 3: Launching EC2 Instance...${NC}"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP_ID" \
    --region "$REGION" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=KidPlay-Arcade}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"
else
    echo -e "${RED}❌ Failed to launch instance${NC}"
    exit 1
fi

# Wait for instance to be running
echo -e "${BLUE}⏳ Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# Get instance public IP and DNS
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].[PublicIpAddress,PublicDnsName]' \
    --output text)

PUBLIC_IP=$(echo "$INSTANCE_INFO" | awk '{print $1}')
PUBLIC_DNS=$(echo "$INSTANCE_INFO" | awk '{print $2}')

echo -e "${GREEN}✅ Instance is running!${NC}"
echo -e "${CYAN}📍 Public IP: $PUBLIC_IP${NC}"
echo -e "${CYAN}📍 Public DNS: $PUBLIC_DNS${NC}"

# Step 4: Wait for SSH to be ready
echo -e "\n${BLUE}🔄 Step 4: Waiting for SSH to be ready...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes...${NC}"

SSH_READY=false
for i in {1..20}; do
    if ssh -i "$PEM_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" "echo 'SSH Ready'" 2>/dev/null; then
        SSH_READY=true
        break
    fi
    echo -e "${YELLOW}Attempt $i/20: SSH not ready yet...${NC}"
    sleep 15
done

if [ "$SSH_READY" = false ]; then
    echo -e "${RED}❌ SSH connection failed. Please check manually:${NC}"
    echo -e "${CYAN}ssh -i $PEM_PATH ec2-user@$PUBLIC_IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection established!${NC}"

# Step 5: Update deployment configuration
echo -e "\n${BLUE}🔧 Step 5: Updating deployment configuration...${NC}"

# Update .env.production with new IP
cat > .env.production << EOF
# Production environment variables for KidPlay Arcade
NODE_ENV=production
REACT_APP_API_BASE_URL=http://$PUBLIC_IP:3001
REACT_APP_API_TIMEOUT=10000
EOF

# Update API configuration
sed -i.bak "s|http://[0-9.]*:3001|http://$PUBLIC_IP:3001|g" src/config/api.ts

# Create deployment script with new instance details
cat > deploy-to-new-instance.sh << EOF
#!/bin/bash

# Deploy to new AWS instance
# Instance: $INSTANCE_ID
# IP: $PUBLIC_IP
# DNS: $PUBLIC_DNS

KEY_PATH="$PEM_PATH"
AWS_HOST="$PUBLIC_DNS"
AWS_IP="$PUBLIC_IP"

echo "🚀 Deploying KidPlay Arcade to new AWS instance..."
echo "📍 Instance: \$AWS_HOST (\$AWS_IP)"

# Build frontend with correct API URL
echo "🔨 Building frontend..."
REACT_APP_API_BASE_URL=http://\$AWS_IP:3001 npm run build

# Deploy to instance
ssh -i "\$KEY_PATH" ec2-user@"\$AWS_HOST" << 'ENDSSH'
    # Install Node.js and dependencies
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install 18
    nvm use 18
    
    # Install PM2
    npm install -g pm2
    
    # Install nginx
    sudo yum update -y
    sudo yum install -y nginx
    sudo systemctl enable nginx
    
    # Clone repository
    git clone https://github.com/ssoward/kidplay-arcade.git
    cd kidplay-arcade
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies and build
    npm install
    npm run build
    
    # Configure nginx
    sudo tee /etc/nginx/conf.d/kidplay-arcade.conf > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name \$AWS_IP \$AWS_HOST;
    
    # Serve React app
    location / {
        root /home/ec2-user/kidplay-arcade/build;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXCONF
    
    # Start nginx
    sudo systemctl restart nginx
    
    # Start backend with PM2
    cd backend
    pm2 start server.js --name kidplay-arcade
    pm2 save
    pm2 startup
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Your KidPlay Arcade is available at: http://\$AWS_IP"
echo "🔧 SSH access: ssh -i \$KEY_PATH ec2-user@\$AWS_HOST"
EOF

chmod +x deploy-to-new-instance.sh

echo -e "${GREEN}✅ Deployment configuration updated${NC}"

# Step 6: Deploy the application
echo -e "\n${BLUE}🚀 Step 6: Deploying KidPlay Arcade...${NC}"

./deploy-to-new-instance.sh

# Final summary
echo -e "\n${GREEN}🎉 AWS Infrastructure Created Successfully!${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Instance Details:${NC}"
echo -e "${CYAN}• Instance ID: $INSTANCE_ID${NC}"
echo -e "${CYAN}• Public IP: $PUBLIC_IP${NC}"
echo -e "${CYAN}• Public DNS: $PUBLIC_DNS${NC}"
echo -e "${CYAN}• Key Pair: $KEY_NAME${NC}"
echo -e "${CYAN}• PEM File: $PEM_PATH${NC}"
echo -e "${CYAN}• Security Group: $SECURITY_GROUP_ID${NC}"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo -e "${GREEN}• Application: http://$PUBLIC_IP${NC}"
echo -e "${GREEN}• Backend API: http://$PUBLIC_IP:3001${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo -e "${CYAN}• SSH: ssh -i $PEM_PATH ec2-user@$PUBLIC_DNS${NC}"
echo -e "${CYAN}• Check Status: ssh -i $PEM_PATH ec2-user@$PUBLIC_DNS 'pm2 status'${NC}"
echo -e "${CYAN}• View Logs: ssh -i $PEM_PATH ec2-user@$PUBLIC_DNS 'pm2 logs'${NC}"
echo ""
echo -e "${YELLOW}💰 Cost Note: Remember to terminate the instance when done to avoid charges:${NC}"
echo -e "${CYAN}aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION${NC}"
