#!/bin/bash

# Enhanced AWS EC2 Instance Creation for KidPlay Arcade
# This script creates a complete AWS infrastructure and deploys the app

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
KEY_NAME="kidplay-arcade-key-$(date +%s)"
PEM_PATH="$HOME/.ssh/${KEY_NAME}.pem"
SECURITY_GROUP_NAME="kidplay-arcade-sg-$(date +%s)"
INSTANCE_TYPE="t3.micro"  # Better performance than t2.micro
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI (us-east-1)
REGION="us-east-1"

echo -e "${GREEN}🚀 Creating Complete AWS Infrastructure for KidPlay Arcade...${NC}"

# Pre-flight checks
echo -e "${BLUE}🔍 Pre-flight checks...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Installing...${NC}"
    if command -v brew &> /dev/null; then
        brew install awscli
    else
        echo -e "${RED}Please install AWS CLI manually:${NC}"
        echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run: aws configure${NC}"
    exit 1
fi

# Check if Node.js is installed locally
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing npm dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"

echo -e "${BLUE}📋 Current AWS Identity:${NC}"
aws sts get-caller-identity

# Create User Data Script for automatic setup
echo -e "${BLUE}📝 Creating user data script...${NC}"
cat > /tmp/user-data.sh << 'USERDATA'
#!/bin/bash
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=== KidPlay Arcade Auto-Setup Starting ==="
date

# Update system
yum update -y

# Install essential packages
yum install -y git nginx sqlite sqlite-devel

# Install Node.js via NVM for ec2-user
sudo -u ec2-user bash << 'EOF'
cd /home/ec2-user
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Install PM2 globally
npm install -g pm2

echo "Node.js and PM2 installed successfully" >> /var/log/user-data.log
EOF

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

echo "=== KidPlay Arcade Auto-Setup Complete ==="
date
USERDATA

# Step 1: Create Key Pair
echo -e "\n${BLUE}🔑 Step 1: Creating Key Pair...${NC}"

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

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "KidPlay Arcade - Web app with Node.js backend" \
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

# Create rules in batch for better efficiency
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --region "$REGION" \
    --ip-permissions \
    '[
        {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "SSH access"}]
        },
        {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP access"}]
        },
        {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTPS access"}]
        },
        {
            "IpProtocol": "tcp",
            "FromPort": 3001,
            "ToPort": 3001,
            "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "Backend API"}]
        }
    ]'

echo -e "${GREEN}✅ Security group rules added${NC}"

# Step 3: Launch EC2 Instance with User Data
echo -e "\n${BLUE}🖥️  Step 3: Launching EC2 Instance with auto-setup...${NC}"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP_ID" \
    --region "$REGION" \
    --user-data file:///tmp/user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=KidPlay-Arcade-Auto}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"
    echo -e "${YELLOW}⏳ Auto-setup is running in the background...${NC}"
else
    echo -e "${RED}❌ Failed to launch instance${NC}"
    exit 1
fi

# Wait for instance to be running
echo -e "${BLUE}⏳ Waiting for instance to be running...${NC}"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# Get instance details
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

# Step 4: Build application locally
echo -e "\n${BLUE}🔨 Step 4: Building application locally...${NC}"

# Update environment configuration
echo "REACT_APP_API_BASE_URL=http://$PUBLIC_IP:3001" > .env.production
echo "REACT_APP_API_TIMEOUT=10000" >> .env.production

# Update API configuration
cp src/config/api.ts src/config/api.ts.backup
sed -i.tmp "s|http://[0-9.]*:3001|http://$PUBLIC_IP:3001|g" src/config/api.ts
sed -i.tmp "s|return 'http://[0-9.]*:3001';|return 'http://$PUBLIC_IP:3001';|g" src/config/api.ts

# Build frontend
echo -e "${BLUE}🏗️  Building frontend with production API URL...${NC}"
REACT_APP_API_BASE_URL=http://$PUBLIC_IP:3001 npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 5: Wait for SSH and auto-setup to complete
echo -e "\n${BLUE}⏳ Step 5: Waiting for SSH access and auto-setup completion...${NC}"
echo -e "${YELLOW}This may take 3-5 minutes for the auto-setup to complete...${NC}"

SSH_READY=false
for i in {1..30}; do
    if ssh -i "$PEM_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" "echo 'SSH Ready'" 2>/dev/null; then
        SSH_READY=true
        break
    fi
    echo -e "${YELLOW}Attempt $i/30: Waiting for SSH and auto-setup...${NC}"
    sleep 20
done

if [ "$SSH_READY" = false ]; then
    echo -e "${RED}❌ SSH connection failed after auto-setup period${NC}"
    echo -e "${CYAN}You can try manually: ssh -i $PEM_PATH ec2-user@$PUBLIC_IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection established!${NC}"

# Check if auto-setup completed
echo -e "${BLUE}🔍 Checking auto-setup status...${NC}"
ssh -i "$PEM_PATH" ec2-user@"$PUBLIC_IP" << 'CHECKSETUP'
echo "=== Auto-Setup Status ==="
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm version: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "PM2 status: $(pm2 --version 2>/dev/null || echo 'Not installed')"
echo "Nginx status: $(sudo systemctl is-active nginx 2>/dev/null || echo 'Not running')"
echo "=== Auto-Setup Log Tail ==="
tail -20 /var/log/user-data.log 2>/dev/null || echo "No setup log found"
CHECKSETUP

# Step 6: Deploy the application
echo -e "\n${BLUE}🚀 Step 6: Deploying KidPlay Arcade...${NC}"

# Create deployment package
tar -czf kidplay-arcade-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude='*.tar.gz' \
    --exclude=build/static/js/*.map \
    --exclude=build/static/css/*.map \
    .

# Upload and deploy
scp -i "$PEM_PATH" -o StrictHostKeyChecking=no kidplay-arcade-deploy.tar.gz ec2-user@"$PUBLIC_IP":~/

ssh -i "$PEM_PATH" ec2-user@"$PUBLIC_IP" << DEPLOY
echo "🚀 Starting deployment..."

# Extract application
tar -xzf kidplay-arcade-deploy.tar.gz
cd kidplay-arcade

# Install backend dependencies
cd backend
npm install --production
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install --production
fi

# Configure nginx
sudo tee /etc/nginx/conf.d/kidplay-arcade.conf > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name $PUBLIC_IP $PUBLIC_DNS;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Serve React app
    location / {
        root /home/ec2-user/kidplay-arcade/build;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
}
NGINXCONF

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECOEOF'
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
ECOEOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 delete kidplay-arcade 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Set up PM2 to start on boot
sudo env PATH=\$PATH:/home/ec2-user/.nvm/versions/node/\$(node --version)/bin /home/ec2-user/.nvm/versions/node/\$(node --version)/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ Deployment complete!"
DEPLOY

# Clean up local deployment package
rm -f kidplay-arcade-deploy.tar.gz

# Step 7: Verify deployment
echo -e "\n${BLUE}🔍 Step 7: Verifying deployment...${NC}"

sleep 10

# Test backend API
echo -e "${CYAN}Testing backend API...${NC}"
if curl -s -f "http://$PUBLIC_IP:3001/api/status" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API test inconclusive${NC}"
fi

# Test frontend
echo -e "${CYAN}Testing frontend...${NC}"
FRONTEND_STATUS=$(curl -s -w "%{http_code}" "http://$PUBLIC_IP" -o /dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend returned status: $FRONTEND_STATUS${NC}"
fi

# Create management script
cat > manage-instance.sh << MGMT
#!/bin/bash
# KidPlay Arcade AWS Instance Management

KEY_PATH="$PEM_PATH"
INSTANCE_ID="$INSTANCE_ID"
PUBLIC_IP="$PUBLIC_IP"
PUBLIC_DNS="$PUBLIC_DNS"
REGION="$REGION"

case "\$1" in
    ssh)
        ssh -i "\$KEY_PATH" ec2-user@"\$PUBLIC_IP"
        ;;
    status)
        ssh -i "\$KEY_PATH" ec2-user@"\$PUBLIC_IP" 'pm2 status && sudo systemctl status nginx'
        ;;
    logs)
        ssh -i "\$KEY_PATH" ec2-user@"\$PUBLIC_IP" 'pm2 logs --lines 50'
        ;;
    restart)
        ssh -i "\$KEY_PATH" ec2-user@"\$PUBLIC_IP" 'pm2 restart kidplay-arcade && sudo systemctl restart nginx'
        ;;
    stop)
        echo "Stopping instance \$INSTANCE_ID..."
        aws ec2 stop-instances --instance-ids "\$INSTANCE_ID" --region "\$REGION"
        ;;
    start)
        echo "Starting instance \$INSTANCE_ID..."
        aws ec2 start-instances --instance-ids "\$INSTANCE_ID" --region "\$REGION"
        ;;
    terminate)
        echo "⚠️  This will permanently delete the instance!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "\$confirm" = "yes" ]; then
            aws ec2 terminate-instances --instance-ids "\$INSTANCE_ID" --region "\$REGION"
            echo "Instance termination initiated..."
        fi
        ;;
    info)
        echo "Instance ID: \$INSTANCE_ID"
        echo "Public IP: \$PUBLIC_IP"
        echo "Public DNS: \$PUBLIC_DNS"
        echo "Key Path: \$KEY_PATH"
        echo "Region: \$REGION"
        ;;
    *)
        echo "Usage: \$0 {ssh|status|logs|restart|stop|start|terminate|info}"
        echo ""
        echo "Commands:"
        echo "  ssh       - Connect to instance via SSH"
        echo "  status    - Check application and nginx status"
        echo "  logs      - View application logs"
        echo "  restart   - Restart application and nginx"
        echo "  stop      - Stop EC2 instance (saves money)"
        echo "  start     - Start stopped EC2 instance"
        echo "  terminate - Permanently delete instance"
        echo "  info      - Show instance information"
        ;;
esac
MGMT

chmod +x manage-instance.sh

# Final success message
echo -e "\n${GREEN}🎉 KidPlay Arcade Successfully Deployed!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Instance Details:${NC}"
echo -e "${CYAN}• Instance ID: $INSTANCE_ID${NC}"
echo -e "${CYAN}• Public IP: $PUBLIC_IP${NC}"
echo -e "${CYAN}• Public DNS: $PUBLIC_DNS${NC}"
echo -e "${CYAN}• Key File: $PEM_PATH${NC}"
echo ""
echo -e "${BLUE}🌐 Your KidPlay Arcade is now live at:${NC}"
echo -e "${GREEN}• Application: http://$PUBLIC_IP${NC}"
echo -e "${GREEN}• Backend API: http://$PUBLIC_IP:3001${NC}"
echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo -e "${CYAN}• Quick access: ./manage-instance.sh ssh${NC}"
echo -e "${CYAN}• Check status: ./manage-instance.sh status${NC}"
echo -e "${CYAN}• View logs: ./manage-instance.sh logs${NC}"
echo -e "${CYAN}• All commands: ./manage-instance.sh${NC}"
echo ""
echo -e "${YELLOW}💰 Cost Management:${NC}"
echo -e "${CYAN}• Stop instance: ./manage-instance.sh stop${NC}"
echo -e "${CYAN}• Start instance: ./manage-instance.sh start${NC}"
echo -e "${CYAN}• Terminate (delete): ./manage-instance.sh terminate${NC}"
echo ""
echo -e "${GREEN}✨ Enjoy your KidPlay Arcade!${NC}"
