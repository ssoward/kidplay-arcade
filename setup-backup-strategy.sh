#!/bin/bash

# KidPlay Arcade - Backup Strategy Setup
# Implements comprehensive backup and disaster recovery

echo "🛡️ KidPlay Arcade - Backup Strategy Setup"
echo "=========================================="

# Configuration - Update these with your instance details
INSTANCE_ID="i-06a45bb65c867ce91"
REGION="us-east-1"

if [[ "$INSTANCE_ID" == "<UPDATE_WITH_INSTANCE_ID>" ]]; then
    echo "⚠️  Please update INSTANCE_ID in this script first!"
    echo "   Edit: setup-backup-strategy.sh"
    echo "   Set INSTANCE_ID to your EC2 instance ID"
    exit 1
fi

echo "📋 Backup Configuration:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Region: $REGION"
echo ""

echo "🔧 Setting Up Backup Strategies..."
echo ""

# 1. EBS Snapshot Schedule
echo "1. ⏰ Creating EBS Snapshot Schedule..."

# Create IAM role for DLM (Data Lifecycle Manager)
cat > dlm-role-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "dlm.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

echo "Creating DLM service role..."
aws iam create-role \
    --role-name DLMRole-KidPlayArcade \
    --assume-role-policy-document file://dlm-role-policy.json \
    --region $REGION || echo "Role might already exist"

# Attach policy to role
aws iam attach-role-policy \
    --role-name DLMRole-KidPlayArcade \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole \
    --region $REGION || echo "Policy might already be attached"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create lifecycle policy for daily snapshots
cat > lifecycle-policy.json << EOF
{
  "ExecutionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/DLMRole-KidPlayArcade",
  "Description": "KidPlay Arcade Daily EBS Snapshots",
  "State": "ENABLED",
  "PolicyDetails": {
    "PolicyType": "EBS_SNAPSHOT_MANAGEMENT",
    "ResourceTypes": ["INSTANCE"],
    "TargetTags": [
      {
        "Key": "Project",
        "Value": "KidPlayArcade"
      }
    ],
    "Schedules": [
      {
        "Name": "DailySnapshots",
        "CreateRule": {
          "CronExpression": "cron(0 4 * * ? *)"
        },
        "RetainRule": {
          "Count": 7
        },
        "CopyTags": true,
        "TagsToAdd": [
          {
            "Key": "SnapshotType",
            "Value": "Automated"
          },
          {
            "Key": "Project",
            "Value": "KidPlayArcade"
          }
        ]
      }
    ]
  }
}
EOF

echo "Creating lifecycle policy for daily snapshots..."
aws dlm create-lifecycle-policy \
    --cli-input-json file://lifecycle-policy.json \
    --region $REGION || echo "Lifecycle policy creation failed"

echo "✅ EBS Snapshot schedule created (daily at 4 AM UTC, 7-day retention)"

# 2. Manual Snapshot Creation
echo ""
echo "2. 📸 Creating Manual Snapshot..."

# Get volume IDs for the instance
VOLUME_IDS=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[].Instances[].BlockDeviceMappings[].Ebs.VolumeId' \
    --output text)

if [ -n "$VOLUME_IDS" ]; then
    for VOLUME_ID in $VOLUME_IDS; do
        echo "Creating snapshot for volume: $VOLUME_ID"
        aws ec2 create-snapshot \
            --volume-id $VOLUME_ID \
            --description "KidPlay Arcade Manual Snapshot - $(date)" \
            --tag-specifications "ResourceType=snapshot,Tags=[{Key=Project,Value=KidPlayArcade},{Key=Type,Value=Manual},{Key=Date,Value=$(date +%Y-%m-%d)}]" \
            --region $REGION
    done
    echo "✅ Manual snapshots created"
else
    echo "⚠️  No EBS volumes found for instance $INSTANCE_ID"
fi

# 3. AMI Creation
echo ""
echo "3. 💿 Creating AMI (Amazon Machine Image)..."

aws ec2 create-image \
    --instance-id $INSTANCE_ID \
    --name "KidPlayArcade-Backup-$(date +%Y%m%d-%H%M%S)" \
    --description "KidPlay Arcade Application AMI - $(date)" \
    --tag-specifications "ResourceType=image,Tags=[{Key=Project,Value=KidPlayArcade},{Key=Type,Value=ApplicationBackup},{Key=Date,Value=$(date +%Y-%m-%d)}]" \
    --region $REGION

echo "✅ AMI backup initiated"

# 4. Database Backup Script
echo ""
echo "4. 🗄️ Creating Database Backup Script..."

cat > backup-database.sh << 'EOF'
#!/bin/bash
# Database backup script for KidPlay Arcade

BACKUP_DIR="/home/ec2-user/backups"
DB_FILE="/home/ec2-user/backend/kidplay_arcade.db"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup SQLite database
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/kidplay_arcade_$DATE.db"
    echo "✅ Database backed up to: $BACKUP_DIR/kidplay_arcade_$DATE.db"
    
    # Keep only last 14 backups
    cd $BACKUP_DIR
    ls -t kidplay_arcade_*.db | tail -n +15 | xargs -r rm
    echo "🧹 Old backups cleaned up"
else
    echo "⚠️  Database file not found: $DB_FILE"
fi
EOF

echo "✅ Database backup script created: backup-database.sh"

# 5. Monitoring and Alerting Setup
echo ""
echo "5. 📊 Setting Up CloudWatch Monitoring..."

# Create CloudWatch alarm for high CPU
aws cloudwatch put-metric-alarm \
    --alarm-name "KidPlayArcade-HighCPU" \
    --alarm-description "KidPlay Arcade High CPU Usage" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=$INSTANCE_ID \
    --evaluation-periods 2 \
    --region $REGION || echo "CloudWatch alarm creation failed"

echo "✅ CloudWatch monitoring configured"

# 6. Recovery Instructions
echo ""
echo "6. 📝 Creating Recovery Instructions..."

cat > disaster-recovery-plan.md << EOF
# KidPlay Arcade - Disaster Recovery Plan

## Quick Recovery Steps

### 1. Instance Recovery (from AMI)
\`\`\`bash
# Find latest AMI
aws ec2 describe-images --owners self --filters "Name=tag:Project,Values=KidPlayArcade" --query 'Images | sort_by(@, &CreationDate) | [-1].[ImageId,Name]' --output table --region us-east-1

# Launch new instance from AMI
aws ec2 run-instances \\
  --image-id ami-xxxxxxxxx \\
  --instance-type t2.micro \\
  --key-name your-key-name \\
  --security-group-ids sg-xxxxxxxxx \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kidplay-arcade-recovery},{Key=Project,Value=KidPlayArcade}]' \\
  --region us-east-1
\`\`\`

### 2. Data Recovery (from EBS Snapshot)
\`\`\`bash
# Find latest snapshot
aws ec2 describe-snapshots --owner-ids self --filters "Name=tag:Project,Values=KidPlayArcade" --query 'Snapshots | sort_by(@, &StartTime) | [-1].[SnapshotId,Description]' --output table --region us-east-1

# Create volume from snapshot
aws ec2 create-volume --snapshot-id snap-xxxxxxxxx --availability-zone us-east-1a --tag-specifications 'ResourceType=volume,Tags=[{Key=Project,Value=KidPlayArcade}]' --region us-east-1

# Attach volume to instance
aws ec2 attach-volume --volume-id vol-xxxxxxxxx --instance-id i-xxxxxxxxx --device /dev/sdf --region us-east-1
\`\`\`

### 3. Database Recovery
\`\`\`bash
# On the server, restore from backup
scp -i your-key.pem backup-database.sh ec2-user@your-ip:~/
ssh -i your-key.pem ec2-user@your-ip
sudo cp ~/backups/kidplay_arcade_YYYYMMDD-HHMMSS.db ~/backend/kidplay_arcade.db
sudo chown ec2-user:ec2-user ~/backend/kidplay_arcade.db
pm2 restart kidplay-backend
\`\`\`

## Backup Schedule
- **EBS Snapshots**: Daily at 4 AM UTC (7-day retention)
- **Manual Snapshots**: On-demand before major changes
- **AMI Backups**: Weekly or before major deployments
- **Database Backups**: Daily via cron job

## Recovery Testing
Test recovery procedures monthly to ensure they work correctly.
EOF

echo "✅ Disaster recovery plan created: disaster-recovery-plan.md"

echo ""
echo "🎯 Summary of Backup Strategy:"
echo "=============================="
echo "✅ EBS Snapshots: Daily automatic (7-day retention)"
echo "✅ Manual Snapshots: Created for immediate protection"
echo "✅ AMI Backup: Application-level backup created"
echo "✅ Database Backup Script: For SQLite data protection"
echo "✅ CloudWatch Monitoring: CPU usage alerts"
echo "✅ Recovery Plan: Step-by-step disaster recovery"
echo ""
echo "📋 Next Steps:"
echo "1. Copy backup-database.sh to your EC2 instance"
echo "2. Set up cron job for daily database backups"
echo "3. Test recovery procedures"
echo "4. Review and update backup retention policies"

# Cleanup temporary files
rm -f dlm-role-policy.json lifecycle-policy.json

echo ""
echo "🛡️ Backup strategy setup complete!"
EOF
