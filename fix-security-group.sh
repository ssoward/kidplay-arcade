#!/bin/bash

# Fix Security Group for KidPlay Arcade Micro EC2
echo "🔒 Fixing Security Group Configuration..."

INSTANCE_ID="i-0ed5ceb573b273378"
PUBLIC_IP="34.207.127.208"

# Create new security group
TIMESTAMP=$(date +%s)
SG_NAME="kidplay-micro-sg-${TIMESTAMP}"

echo "Creating new security group: $SG_NAME"

# Create security group
aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "KidPlay Arcade Micro Instance Security Group" \
    --region us-east-1 > /tmp/sg_output.json

SG_ID=$(cat /tmp/sg_output.json | grep -o '"GroupId": "[^"]*"' | cut -d'"' -f4)
echo "Created Security Group: $SG_ID"

# Add security rules
echo "Adding SSH rule (port 22)..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

echo "Adding HTTP rule (port 80)..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

echo "Adding Backend API rule (port 3001)..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

# Update instance to use new security group
echo "Updating instance security group..."
aws ec2 modify-instance-attribute \
    --instance-id "$INSTANCE_ID" \
    --groups "$SG_ID" \
    --region us-east-1

echo "✅ Security group updated!"
echo ""
echo "Wait 1-2 minutes then test SSH connection:"
echo "ssh -i kidplay-micro-1750269031.pem ec2-user@$PUBLIC_IP"

# Save security group info
echo "Security Group ID: $SG_ID" >> micro-deployment-info.txt
