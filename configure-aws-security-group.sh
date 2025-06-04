#!/bin/bash

# KidPlay Arcade - AWS Security Group Configuration Script
# This script configures the AWS security group to allow access to port 3001

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Configuring AWS Security Group for KidPlay Arcade${NC}"
echo "Target IP: 3.81.165.163"
echo "Port to open: 3001"
echo ""

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Test AWS credentials
echo -e "${YELLOW}🔍 Testing AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not properly configured${NC}"
    echo "Please configure AWS CLI with: aws configure"
    echo ""
    echo "You'll need:"
    echo "- AWS Access Key ID"
    echo "- AWS Secret Access Key" 
    echo "- Default region (us-east-1)"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials are valid${NC}"

# Find the EC2 instance
echo -e "${YELLOW}🔍 Finding EC2 instance with IP 3.81.165.163...${NC}"

INSTANCE_INFO=$(aws ec2 describe-instances \
    --filters "Name=ip-address,Values=3.81.165.163" \
    --query 'Reservations[*].Instances[*].[InstanceId,SecurityGroups[0].GroupId,SecurityGroups[0].GroupName]' \
    --output text 2>/dev/null)

if [ -z "$INSTANCE_INFO" ]; then
    echo -e "${RED}❌ Could not find EC2 instance with IP 3.81.165.163${NC}"
    echo "Please verify the IP address and ensure the instance exists"
    exit 1
fi

# Parse instance information
INSTANCE_ID=$(echo "$INSTANCE_INFO" | awk '{print $1}')
SECURITY_GROUP_ID=$(echo "$INSTANCE_INFO" | awk '{print $2}')
SECURITY_GROUP_NAME=$(echo "$INSTANCE_INFO" | awk '{print $3}')

echo -e "${GREEN}✅ Found EC2 instance:${NC}"
echo "  Instance ID: $INSTANCE_ID"
echo "  Security Group ID: $SECURITY_GROUP_ID"
echo "  Security Group Name: $SECURITY_GROUP_NAME"
echo ""

# Check if port 3001 is already open
echo -e "${YELLOW}🔍 Checking current security group rules...${NC}"

EXISTING_RULE=$(aws ec2 describe-security-groups \
    --group-ids "$SECURITY_GROUP_ID" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`3001\` && ToPort==\`3001\`]" \
    --output text 2>/dev/null)

if [ -n "$EXISTING_RULE" ]; then
    echo -e "${GREEN}✅ Port 3001 is already open in the security group${NC}"
    echo ""
    echo -e "${YELLOW}🧪 Testing connection to the server...${NC}"
    if curl -s --connect-timeout 10 "http://3.81.165.163:3001/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Server is accessible from external sources${NC}"
        echo "🎉 KidPlay Arcade is ready to use!"
        echo "URL: http://3.81.165.163:3001"
    else
        echo -e "${RED}❌ Server is not responding${NC}"
        echo "The port is open but the server may not be running."
        echo "Check the server status with: ssh -i ~/.ssh/kidplay-arcade-key.pem ubuntu@3.81.165.163 'pm2 list'"
    fi
    exit 0
fi

echo -e "${YELLOW}⚠️  Port 3001 is not open in the security group${NC}"
echo ""

# Add the security group rule
echo -e "${YELLOW}🔓 Adding inbound rule for port 3001...${NC}"

if aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=KidPlay-Arcade-Port-3001},{Key=Purpose,Value=Web-Server-Access}]" 2>/dev/null; then
    
    echo -e "${GREEN}✅ Successfully added inbound rule for port 3001${NC}"
else
    echo -e "${RED}❌ Failed to add security group rule${NC}"
    echo "This might happen if the rule already exists or if you don't have permission."
    echo "You can manually add the rule in the AWS Console:"
    echo "1. Go to EC2 > Security Groups"
    echo "2. Select security group: $SECURITY_GROUP_NAME ($SECURITY_GROUP_ID)"  
    echo "3. Add inbound rule: Type=Custom TCP, Port=3001, Source=0.0.0.0/0"
    exit 1
fi

# Wait a moment for the rule to propagate
echo -e "${YELLOW}⏳ Waiting for security group changes to propagate...${NC}"
sleep 10

# Test the connection
echo -e "${YELLOW}🧪 Testing connection to the server...${NC}"

if curl -s --connect-timeout 15 "http://3.81.165.163:3001/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Success! Server is now accessible from external sources${NC}"
    echo ""
    echo "🎉 KidPlay Arcade is ready to use!"
    echo "🌐 URL: http://3.81.165.163:3001"
    echo ""
    echo "You can now:"
    echo "- Access the web application"
    echo "- Test the authentication endpoints"
    echo "- Connect your frontend application"
else
    echo -e "${YELLOW}⚠️  Port is open but server may not be responding${NC}"
    echo "This could mean:"
    echo "1. The server is not running"
    echo "2. The server is starting up (try again in a few minutes)"
    echo "3. There's a firewall on the server itself"
    echo ""
    echo "To check server status, run:"
    echo "ssh -i ~/.ssh/kidplay-arcade-key.pem ubuntu@3.81.165.163 'pm2 list && pm2 logs kidplay-arcade --lines 20'"
fi

echo ""
echo -e "${GREEN}🔧 Security group configuration completed!${NC}"
