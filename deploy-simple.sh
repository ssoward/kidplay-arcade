#!/bin/bash

# Simple KidPlay Arcade AWS Deployment
# This script creates everything you need in one go

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 KidPlay Arcade - Simple AWS Deployment${NC}"
echo -e "${BLUE}This will create a new AWS instance and deploy your app${NC}"
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

# Launch instance
echo -e "${BLUE}🖥️  Launching EC2 instance...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0b715af88ed6bff62 \
    --count 1 \
    --instance-type t3.micro \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=KidPlay-Arcade}]' \
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
if [ ! -d "node_modules" ]; then
    npm install
fi
REACT_APP_API_BASE_URL=http://$PUBLIC_IP:3001 npm run build

# Wait for SSH
echo -e "${BLUE}⏳ Waiting for SSH access (this takes ~2 minutes)...${NC}"
for i in {1..24}; do
    if ssh -i "$PEM_FILE" -o ConnectTimeout=5 -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" "echo 'ready'" 2>/dev/null; then
        break
    fi
    echo -n "."
    sleep 5
done
echo ""

# Deploy
echo -e "${BLUE}🚀 Deploying application...${NC}"

# Create deployment package
tar -czf deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude='*.tar.gz' \
    .

# Upload
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no deploy.tar.gz ec2-user@"$PUBLIC_IP":~/

# Install and configure
ssh -i "$PEM_FILE" ec2-user@"$PUBLIC_IP" << 'SETUP'
# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs nginx

# Extract and setup app
tar -xzf deploy.tar.gz
cd kidplay-arcade

# Install dependencies
cd backend && npm install --production && cd ..

# Configure nginx
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    root /home/ec2-user/kidplay-arcade/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Start services
sudo systemctl enable nginx
sudo systemctl start nginx

# Install PM2 and start backend
sudo npm install -g pm2
cd backend
pm2 start server.js --name kidplay-arcade
pm2 save
pm2 startup
SETUP

# Clean up
rm -f deploy.tar.gz

# Create simple management script
cat > aws-manage.sh << MANAGE
#!/bin/bash
case "\$1" in
    ssh) ssh -i "$PEM_FILE" ec2-user@$PUBLIC_IP ;;
    stop) aws ec2 stop-instances --instance-ids $INSTANCE_ID ;;
    start) aws ec2 start-instances --instance-ids $INSTANCE_ID ;;
    terminate) aws ec2 terminate-instances --instance-ids $INSTANCE_ID ;;
    *) echo "Usage: \$0 {ssh|stop|start|terminate}" ;;
esac
MANAGE
chmod +x aws-manage.sh

# Success!
echo -e "\n${GREEN}🎉 SUCCESS! Your KidPlay Arcade is deployed!${NC}"
echo -e "\n${BLUE}📋 Quick Info:${NC}"
echo -e "• App URL: ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "• SSH: ${CYAN}./aws-manage.sh ssh${NC}"
echo -e "• Stop instance: ${CYAN}./aws-manage.sh stop${NC}"
echo -e "• Start instance: ${CYAN}./aws-manage.sh start${NC}"
echo -e "• Delete everything: ${CYAN}./aws-manage.sh terminate${NC}"
echo -e "\n${YELLOW}💡 Bookmark http://$PUBLIC_IP - that's your KidPlay Arcade!${NC}"

# Save details
echo "Instance ID: $INSTANCE_ID" > aws-details.txt
echo "Public IP: $PUBLIC_IP" >> aws-details.txt
echo "Key File: $PEM_FILE" >> aws-details.txt
echo "Security Group: $SG_ID" >> aws-details.txt
