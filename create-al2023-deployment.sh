#!/bin/bash

# KidPlay Arcade - Amazon Linux 2023 Deployment with Proper Tagging and Backup
# This script creates a new EC2 instance with comprehensive backup strategies

set -e

echo "🚀 KidPlay Arcade - Amazon Linux 2023 Secure Deployment"
echo "========================================================"

# Configuration
TIMESTAMP=$(date +%s)
PROJECT_NAME="kidplay-arcade"
KEY_NAME="${PROJECT_NAME}-al2023-${TIMESTAMP}"
INSTANCE_NAME="${PROJECT_NAME}-al2023-${TIMESTAMP}"
SECURITY_GROUP_NAME="${PROJECT_NAME}-sg-${TIMESTAMP}"

# Amazon Linux 2023 AMI ID for us-east-1
AMI_ID="ami-0c94855ba95b798c7"  # Amazon Linux 2023 x86_64
INSTANCE_TYPE="t2.micro"
REGION="us-east-1"

echo "📋 Deployment Configuration:"
echo "   Project: ${PROJECT_NAME}"
echo "   Region: ${REGION}"
echo "   Instance Type: ${INSTANCE_TYPE}"
echo "   AMI: ${AMI_ID} (Amazon Linux 2023)"
echo "   Key Name: ${KEY_NAME}"
echo "   Instance Name: ${INSTANCE_NAME}"
echo ""

# Step 1: Create Key Pair
echo "🔑 Step 1: Creating EC2 Key Pair..."
aws ec2 create-key-pair \
    --key-name "${KEY_NAME}" \
    --region "${REGION}" \
    --tag-specifications "ResourceType=key-pair,Tags=[{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=development},{Key=CreatedBy,Value=deployment-script}]" \
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
    --group-name "${SECURITY_GROUP_NAME}" \
    --description "KidPlay Arcade Security Group - AL2023" \
    --region "${REGION}" \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=development},{Key=CreatedBy,Value=deployment-script}]" \
    --query 'GroupId' \
    --output text)

echo "✅ Security Group created: ${SECURITY_GROUP_ID}"

# Configure security group rules
echo "🔧 Configuring security group rules..."

# SSH access
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region "${REGION}"

# HTTP access
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region "${REGION}"

# Backend API access
aws ec2 authorize-security-group-ingress \
    --group-id "${SECURITY_GROUP_ID}" \
    --protocol tcp \
    --port 3001 \
    --cidr 0.0.0.0/0 \
    --region "${REGION}"

echo "✅ Security group rules configured (SSH:22, HTTP:80, Backend:3001)"

# Step 3: Launch EC2 Instance with comprehensive tagging
echo "🖥️  Step 3: Launching Amazon Linux 2023 EC2 Instance..."

# Create user data script for initial setup
USER_DATA=$(cat << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y git htop nginx

# Install Node.js 20 LTS (Amazon Linux 2023 compatible)
dnf install -y nodejs npm

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/kidplay-arcade
chown ec2-user:ec2-user /opt/kidplay-arcade

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Setup basic nginx config
cat > /etc/nginx/conf.d/default.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    # Basic health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
NGINXEOF

systemctl reload nginx

# Log deployment completion
echo "$(date): Amazon Linux 2023 setup completed" >> /var/log/kidplay-deployment.log
USERDATA
)

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "${AMI_ID}" \
    --count 1 \
    --instance-type "${INSTANCE_TYPE}" \
    --key-name "${KEY_NAME}" \
    --security-group-ids "${SECURITY_GROUP_ID}" \
    --user-data "${USER_DATA}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=development},{Key=CreatedBy,Value=deployment-script},{Key=BackupRequired,Value=true}]" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3","DeleteOnTermination":false,"Encrypted":true}}]' \
    --region "${REGION}" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launched: ${INSTANCE_ID}"

# Step 4: Wait for instance to be running
echo "⏳ Step 4: Waiting for instance to be running..."
aws ec2 wait instance-running \
    --instance-ids "${INSTANCE_ID}" \
    --region "${REGION}"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "${INSTANCE_ID}" \
    --region "${REGION}" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ Instance is running!"
echo ""

# Step 5: Setup Backup Strategy
echo "💾 Step 5: Setting up Backup Strategy..."

# Create EBS snapshot for initial state
VOLUME_ID=$(aws ec2 describe-instances \
    --instance-ids "${INSTANCE_ID}" \
    --region "${REGION}" \
    --query 'Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId' \
    --output text)

# Create initial snapshot
SNAPSHOT_ID=$(aws ec2 create-snapshot \
    --volume-id "${VOLUME_ID}" \
    --description "Initial snapshot for ${INSTANCE_NAME}" \
    --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=${INSTANCE_NAME}-initial},{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=development},{Key=CreatedBy,Value=deployment-script}]" \
    --region "${REGION}" \
    --query 'SnapshotId' \
    --output text)

echo "✅ Initial EBS snapshot created: ${SNAPSHOT_ID}"

# Step 6: Save deployment information
echo "📊 Step 6: Saving deployment information..."

cat > deployment-info-al2023.txt << EOF
KidPlay Arcade - Amazon Linux 2023 Deployment
==============================================
Date: $(date)
Project: ${PROJECT_NAME}
Environment: development

AWS Resources:
--------------
Instance ID: ${INSTANCE_ID}
Public IP: ${PUBLIC_IP}
Key Name: ${KEY_NAME}
Key File: ${KEY_NAME}.pem
Security Group ID: ${SECURITY_GROUP_ID}
Volume ID: ${VOLUME_ID}
Initial Snapshot ID: ${SNAPSHOT_ID}
Region: ${REGION}
Instance Type: ${INSTANCE_TYPE}
AMI ID: ${AMI_ID}

Connection:
-----------
SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}

Application URLs (after deployment):
------------------------------------
Frontend: http://${PUBLIC_IP}
Backend API: http://${PUBLIC_IP}:3001
Health Check: http://${PUBLIC_IP}/health

Backup Strategy:
----------------
- EBS volumes configured with DeleteOnTermination=false
- Encrypted EBS volumes for security
- Initial snapshot created: ${SNAPSHOT_ID}
- Comprehensive resource tagging for management

Next Steps:
-----------
1. Test SSH connection
2. Deploy KidPlay Arcade application
3. Configure automated backups
4. Move PEM file to ~/.ssh/ directory

Security Notes:
---------------
- All resources tagged with Project=${PROJECT_NAME}
- EBS volumes are encrypted
- Security group allows SSH, HTTP, and backend API access
- Key pair is properly secured with 400 permissions
EOF

echo "💾 Deployment info saved to: deployment-info-al2023.txt"
echo ""
echo "🎯 Deployment Summary:"
echo "======================="
echo "✅ Amazon Linux 2023 instance created: ${INSTANCE_ID}"
echo "✅ Public IP: ${PUBLIC_IP}"
echo "✅ SSH Key: ${KEY_NAME}.pem"
echo "✅ Security Group: ${SECURITY_GROUP_ID}"
echo "✅ Encrypted EBS volume with backup: ${VOLUME_ID}"
echo "✅ Initial snapshot: ${SNAPSHOT_ID}"
echo ""
echo "🔗 Test Connection:"
echo "ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo "🚀 Ready for application deployment!"
echo ""
echo "⚠️  Important: Move PEM file to secure location after testing:"
echo "   mv ${KEY_NAME}.pem ~/.ssh/"
echo "   chmod 400 ~/.ssh/${KEY_NAME}.pem"

# Export variables for next deployment script
export INSTANCE_ID
export PUBLIC_IP
export KEY_NAME
export PROJECT_NAME
export VOLUME_ID

echo ""
echo "✅ Environment variables exported for application deployment"
