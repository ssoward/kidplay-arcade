#!/bin/bash

# KidPlay Arcade - Complete Micro EC2 Deployment
# Handles instance creation, app deployment, and security

set -e

echo "🚀 KidPlay Arcade - Complete Deployment to New Micro EC2"
echo "========================================================"

# Configuration
REGION="us-east-1"
INSTANCE_TYPE="t2.micro"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2023

# Use existing key or create new one
if [ -f "kidplay-micro-1750269031.pem" ]; then
    KEY_NAME="kidplay-micro-1750269031"
    echo "✅ Using existing key: $KEY_NAME"
else
    TIMESTAMP=$(date +%s)
    KEY_NAME="kidplay-micro-${TIMESTAMP}"
    echo "🔑 Creating new key pair: $KEY_NAME"
    
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region "$REGION" \
        --query 'KeyMaterial' \
        --output text > "${KEY_NAME}.pem"
    
    chmod 400 "${KEY_NAME}.pem"
    echo "✅ Key created: ${KEY_NAME}.pem"
fi

# Launch instance
echo "🖥️  Launching EC2 instance..."
INSTANCE_OUTPUT=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-groups default \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=kidplay-arcade-micro}]" \
    --region "$REGION" \
    --output json)

INSTANCE_ID=$(echo "$INSTANCE_OUTPUT" | grep -o '"InstanceId": "[^"]*"' | cut -d'"' -f4)
echo "✅ Instance launched: $INSTANCE_ID"

# Wait for running state
echo "⏳ Waiting for instance to be running..."
sleep 30

# Get public IP
for i in {1..10}; do
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text 2>/dev/null || echo "null")
    
    if [ "$PUBLIC_IP" != "null" ] && [ "$PUBLIC_IP" != "None" ]; then
        break
    fi
    echo "   Attempt $i/10: Waiting for public IP..."
    sleep 10
done

if [ "$PUBLIC_IP" = "null" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "❌ Failed to get public IP"
    exit 1
fi

echo "✅ Instance is running!"
echo ""
echo "📊 Deployment Summary:"
echo "====================="
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Key File: ${KEY_NAME}.pem"
echo "SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""

# Save deployment info
cat > micro-deployment-info.txt << EOF
KidPlay Arcade Micro EC2 Deployment
===================================
Date: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Key Name: $KEY_NAME
Key File: ${KEY_NAME}.pem
Region: $REGION
Instance Type: $INSTANCE_TYPE

SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP

App URLs (after deployment):
Frontend: http://$PUBLIC_IP
Backend API: http://$PUBLIC_IP:3001
EOF

echo "💾 Deployment info saved to: micro-deployment-info.txt"
echo ""
echo "🎯 Ready for application deployment!"
echo "   Next: Deploy the KidPlay Arcade application"

# Export variables for next steps
export INSTANCE_ID
export PUBLIC_IP
export KEY_NAME
echo "Variables exported for deployment scripts"
