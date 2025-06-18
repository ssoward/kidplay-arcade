#!/bin/bash

# KidPlay Arcade - Secure Micro EC2 Deployment Script
# Creates new t2.micro instance in us-east-1 with secure key management

set -e

echo "🚀 KidPlay Arcade - Secure Micro EC2 Deployment"
echo "=================================================="

# Generate unique key name
TIMESTAMP=$(date +%s)
KEY_NAME="kidplay-micro-${TIMESTAMP}"
INSTANCE_NAME="kidplay-arcade-micro-${TIMESTAMP}"

echo "📋 Deployment Configuration:"
echo "   Region: us-east-1"
echo "   Instance Type: t2.micro"
echo "   Key Name: ${KEY_NAME}"
echo "   Instance Name: ${INSTANCE_NAME}"
echo ""

# Step 1: Create Key Pair
echo "🔑 Step 1: Creating EC2 Key Pair..."
aws ec2 create-key-pair \
    --key-name "${KEY_NAME}" \
    --region us-east-1 \
    --query 'KeyMaterial' \
    --output text > "${KEY_NAME}.pem"

if [ $? -eq 0 ]; then
    chmod 400 "${KEY_NAME}.pem"
    echo "✅ Key pair created: ${KEY_NAME}.pem"
else
    echo "❌ Failed to create key pair"
    exit 1
fi

# Step 2: Create Security Group
echo "🔒 Step 2: Creating Security Group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "kidplay-arcade-sg-${TIMESTAMP}" \
    --description "KidPlay Arcade Security Group" \
    --region us-east-1 \
    --query 'GroupId' \
    --output text)

echo "✅ Security Group created: ${SECURITY_GROUP_ID}"

# Configure security group rules
echo "🔧 Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

echo "✅ Security group rules configured (SSH:22, HTTP:80, Backend:3001)"

# Step 3: Launch EC2 Instance
echo "🖥️  Step 3: Launching t2.micro EC2 Instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t2.micro \
    --key-name "${KEY_NAME}" \
    --security-group-ids "${SECURITY_GROUP_ID}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
    --region us-east-1 \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launching: ${INSTANCE_ID}"

# Step 4: Wait for instance to be running
echo "⏳ Step 4: Waiting for instance to be running..."
aws ec2 wait instance-running \
    --instance-ids "${INSTANCE_ID}" \
    --region us-east-1

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "${INSTANCE_ID}" \
    --region us-east-1 \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance is running!"
echo ""
echo "📊 Deployment Summary:"
echo "===================="
echo "Instance ID: ${INSTANCE_ID}"
echo "Public IP: ${PUBLIC_IP}"
echo "Key File: ${KEY_NAME}.pem"
echo "Security Group: ${SECURITY_GROUP_ID}"
echo ""
echo "🔐 SSH Command:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
KidPlay Arcade Micro EC2 Deployment
===================================
Date: $(date)
Instance ID: ${INSTANCE_ID}
Public IP: ${PUBLIC_IP}
Key Name: ${KEY_NAME}
Key File: ${KEY_NAME}.pem
Security Group ID: ${SECURITY_GROUP_ID}
Region: us-east-1
Instance Type: t2.micro

SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}

Next Steps:
1. Test SSH connection
2. Deploy application
3. Move PEM file to ~/.ssh/
EOF

echo "💾 Deployment info saved to: deployment-info.txt"
echo ""
echo "🎯 Next: Run the deployment script to install the application"
echo "   Then move ${KEY_NAME}.pem to ~/.ssh/ for security"
