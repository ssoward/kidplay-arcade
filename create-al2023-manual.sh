#!/bin/bash

# KidPlay Arcade - Simple AL2023 Deployment (Manual Fallback)
# This script provides commands you can run manually if AWS CLI hangs

echo "🚀 KidPlay Arcade - Amazon Linux 2023 Deployment"
echo "================================================"
echo ""
echo "⚠️  AWS CLI seems to be hanging. Here are the manual commands to run:"
echo ""

TIMESTAMP=$(date +%s)
KEY_NAME="kidplay-al2023-${TIMESTAMP}"
INSTANCE_NAME="kidplay-arcade-al2023-${TIMESTAMP}"

echo "📋 Configuration:"
echo "   Key Name: ${KEY_NAME}"
echo "   Instance Name: ${INSTANCE_NAME}"
echo "   Region: us-east-1"
echo "   AMI: ami-0c02fb55956c7d316 (Amazon Linux 2023)"
echo ""

echo "🔧 Manual Commands to Run:"
echo "=========================="
echo ""

echo "1. Create Key Pair:"
echo "aws ec2 create-key-pair --key-name ${KEY_NAME} --region us-east-1 --query 'KeyMaterial' --output text > ${KEY_NAME}.pem"
echo "chmod 400 ${KEY_NAME}.pem"
echo ""

echo "2. Create Security Group:"
echo "aws ec2 create-security-group --group-name kidplay-sg-${TIMESTAMP} --description 'KidPlay Arcade Security Group' --region us-east-1"
echo ""

echo "3. Get Security Group ID (from step 2 output) and add rules:"
echo "export SG_ID=sg-xxxxxxxxx  # Replace with actual ID from step 2"
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region us-east-1"
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1" 
echo "aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region us-east-1"
echo ""

echo "4. Launch Instance:"
echo "aws ec2 run-instances \\"
echo "  --image-id ami-0c02fb55956c7d316 \\"
echo "  --count 1 \\"
echo "  --instance-type t2.micro \\"
echo "  --key-name ${KEY_NAME} \\"
echo "  --security-group-ids \$SG_ID \\"
echo "  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Project,Value=KidPlayArcade}]' \\"
echo "  --region us-east-1"
echo ""

echo "5. Get Instance Info:"
echo "aws ec2 describe-instances --filters 'Name=tag:Name,Values=${INSTANCE_NAME}' --region us-east-1 --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]' --output table"
echo ""

echo "💡 Alternative: Use AWS Console"
echo "==============================="
echo "If CLI continues to hang, you can create the instance via AWS Console:"
echo "1. Go to EC2 Dashboard → Launch Instance"
echo "2. Name: ${INSTANCE_NAME}"
echo "3. AMI: Amazon Linux 2023"
echo "4. Instance Type: t2.micro"
echo "5. Key Pair: Create new → ${KEY_NAME}"
echo "6. Security Group: Create new with ports 22, 80, 3001"
echo "7. Tags: Project=KidPlayArcade"
echo ""

# Save these commands to a file for easy reference
cat > manual-deployment-commands.txt << EOF
# KidPlay Arcade Manual Deployment Commands
# Generated: $(date)

KEY_NAME=${KEY_NAME}
INSTANCE_NAME=${INSTANCE_NAME}

# 1. Create Key Pair
aws ec2 create-key-pair --key-name ${KEY_NAME} --region us-east-1 --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
chmod 400 ${KEY_NAME}.pem

# 2. Create Security Group
aws ec2 create-security-group --group-name kidplay-sg-${TIMESTAMP} --description 'KidPlay Arcade Security Group' --region us-east-1

# 3. Add Security Group Rules (replace SG_ID with actual ID)
export SG_ID=sg-xxxxxxxxx
aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id \$SG_ID --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region us-east-1

# 4. Launch Instance
aws ec2 run-instances \\
  --image-id ami-0c02fb55956c7d316 \\
  --count 1 \\
  --instance-type t2.micro \\
  --key-name ${KEY_NAME} \\
  --security-group-ids \$SG_ID \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Project,Value=KidPlayArcade}]' \\
  --region us-east-1

# 5. Get Instance Info
aws ec2 describe-instances --filters 'Name=tag:Name,Values=${INSTANCE_NAME}' --region us-east-1 --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]' --output table
EOF

echo "📁 Commands saved to: manual-deployment-commands.txt"
echo ""
echo "🎯 Next Steps:"
echo "1. Run the commands above manually"
echo "2. Once instance is running, we'll deploy the application"
echo "3. Set up backup strategies"
