#!/bin/bash

# KidPlay Arcade - Fresh Amazon Linux 2023 Deployment
# Clean up old instances and create new modern deployment

set -e

echo "🚀 KidPlay Arcade - Fresh Amazon Linux 2023 Deployment"
echo "======================================================="

REGION="us-east-1"
INSTANCE_TYPE="t2.micro"
# Amazon Linux 2023 AMI for us-east-1 (x86_64)
AMI_ID="ami-0c7217cdde317cfec"

echo "📋 Configuration:"
echo "   Region: $REGION"
echo "   Instance Type: $INSTANCE_TYPE"
echo "   AMI: Amazon Linux 2023 ($AMI_ID)"
echo ""

# Step 1: Clean up existing instances
echo "🗑️  Step 1: Cleaning up existing instances..."

# Get all running instances
RUNNING_INSTANCES=$(aws ec2 describe-instances \
    --region "$REGION" \
    --filters "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text 2>/dev/null || echo "")

if [ -n "$RUNNING_INSTANCES" ] && [ "$RUNNING_INSTANCES" != "None" ]; then
    echo "Found running instances: $RUNNING_INSTANCES"
    for instance in $RUNNING_INSTANCES; do
        echo "Terminating instance: $instance"
        aws ec2 terminate-instances --instance-ids "$instance" --region "$REGION"
    done
    echo "✅ Instances terminated, waiting for termination..."
    sleep 30
else
    echo "✅ No running instances found"
fi

# Step 2: Clean up old security groups (optional)
echo "🔒 Step 2: Cleaning up old security groups..."
OLD_SGS=$(aws ec2 describe-security-groups \
    --region "$REGION" \
    --filters "Name=group-name,Values=kidplay-*" \
    --query 'SecurityGroups[].GroupId' \
    --output text 2>/dev/null || echo "")

if [ -n "$OLD_SGS" ] && [ "$OLD_SGS" != "None" ]; then
    for sg in $OLD_SGS; do
        echo "Attempting to delete security group: $sg"
        aws ec2 delete-security-group --group-id "$sg" --region "$REGION" 2>/dev/null || echo "Could not delete $sg (may be in use)"
    done
fi

# Step 3: Create new key pair
echo "🔑 Step 3: Creating new key pair..."
TIMESTAMP=$(date +%s)
KEY_NAME="kidplay-al2023-${TIMESTAMP}"

aws ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --region "$REGION" \
    --query 'KeyMaterial' \
    --output text > "${KEY_NAME}.pem"

chmod 400 "${KEY_NAME}.pem"
echo "✅ Key pair created: ${KEY_NAME}.pem"

# Step 4: Create new security group
echo "🔒 Step 4: Creating security group..."
SG_NAME="kidplay-al2023-sg-${TIMESTAMP}"

SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "KidPlay Arcade AL2023 Security Group" \
    --region "$REGION" \
    --query 'GroupId' \
    --output text)

echo "✅ Security Group created: $SG_ID"

# Add security group rules
echo "🔧 Configuring security group rules..."

# SSH (22)
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

# HTTP (80)
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

# Backend API (3001)
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

echo "✅ Security group rules configured"

# Step 5: Launch new Amazon Linux 2023 instance
echo "🖥️  Step 5: Launching Amazon Linux 2023 instance..."
INSTANCE_NAME="kidplay-arcade-al2023-${TIMESTAMP}"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region "$REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launched: $INSTANCE_ID"

# Step 6: Wait for instance to be running
echo "⏳ Step 6: Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance is running!"
echo ""
echo "📊 Fresh Deployment Summary:"
echo "============================"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Key File: ${KEY_NAME}.pem"
echo "Security Group: $SG_ID"
echo "OS: Amazon Linux 2023"
echo "SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""

# Save deployment info
cat > al2023-deployment-info.txt << EOF
KidPlay Arcade - Amazon Linux 2023 Deployment
=============================================
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Key Name: $KEY_NAME
Key File: ${KEY_NAME}.pem
Security Group ID: $SG_ID
Region: $REGION
Instance Type: $INSTANCE_TYPE
AMI: Amazon Linux 2023 ($AMI_ID)

SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP

App URLs (after deployment):
Frontend: http://$PUBLIC_IP
Backend API: http://$PUBLIC_IP:3001

Next Steps:
1. Test SSH connection
2. Deploy KidPlay Arcade application
3. Move PEM file to ~/.ssh/ for security
EOF

echo "💾 Deployment info saved to: al2023-deployment-info.txt"
echo ""
echo "🎯 Ready for application deployment!"
echo "   Amazon Linux 2023 comes with modern Node.js and package management"

# Export variables for next deployment script
export INSTANCE_ID
export PUBLIC_IP
export KEY_NAME="${KEY_NAME}.pem"
export SG_ID

echo "Variables exported for deployment scripts"
