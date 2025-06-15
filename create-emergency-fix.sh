#!/bin/bash

# Emergency Server Fix - Create Redeployment Package
# Since SSH access is currently blocked, this creates a package for manual deployment

set -e

echo "🔧 Creating Emergency Redeployment Package for KidPlay Arcade"
echo "============================================================"

PROJECT_ROOT="/Users/ssoward/sandbox/workspace/FamilySearch/kidplay-arcade"
PACKAGE_NAME="kidplay-arcade-emergency-fix-$(date +%Y%m%d-%H%M%S)"

cd "$PROJECT_ROOT"

echo ""
echo "📦 Creating deployment package..."

# Create a temporary directory for the package
mkdir -p "/tmp/$PACKAGE_NAME"

# Copy essential backend files
echo "📁 Copying backend files..."
cp -r backend "/tmp/$PACKAGE_NAME/"
cp ecosystem.config.js "/tmp/$PACKAGE_NAME/"
cp .env.production "/tmp/$PACKAGE_NAME/.env"

# Copy deployment scripts
echo "📜 Copying deployment scripts..."
cp deploy-db-auth-to-aws.sh "/tmp/$PACKAGE_NAME/"
cp setup-db-auth.sh "/tmp/$PACKAGE_NAME/"
cp backend/test-db-auth.js "/tmp/$PACKAGE_NAME/"

# Create a simple fix script
cat > "/tmp/$PACKAGE_NAME/emergency-server-fix.sh" << 'EOF'
#!/bin/bash

# Emergency Server Fix Script
# Run this script on the AWS server to fix the configuration

echo "🔧 Emergency KidPlay Arcade Server Fix"
echo "======================================"

# Stop all PM2 processes
echo "🛑 Stopping current PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Backup current setup
echo "💾 Creating backup..."
cp ~/kidplay-arcade/ecosystem.config.js ~/kidplay-arcade/ecosystem.config.js.backup || true

# Update ecosystem configuration to use database server
echo "⚙️ Updating ecosystem configuration..."
cat > ~/kidplay-arcade/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server-with-db-auth.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOL

# Start the database-backed server
echo "🚀 Starting database-backed server..."
cd ~/kidplay-arcade
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the server
echo "🧪 Testing server..."
curl -s "http://localhost:3001/api/health" || echo "Health endpoint not responding"

echo ""
echo "📋 Current PM2 status:"
pm2 list

echo ""
echo "📝 Recent logs:"
pm2 logs --lines 10

echo ""
echo "✅ Emergency fix completed!"
echo "🌐 Server should now be accessible at: http://3.81.165.163:3001/api/health"
EOF

chmod +x "/tmp/$PACKAGE_NAME/emergency-server-fix.sh"

# Create package archive
echo "📦 Creating archive..."
cd /tmp
tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"

echo ""
echo "✅ Emergency redeployment package created!"
echo "📦 Package location: /tmp/$PACKAGE_NAME.tar.gz"
echo ""
echo "📋 Manual deployment options:"
echo ""
echo "1. 🔑 Fix SSH Key Access (Recommended):"
echo "   - Check AWS EC2 Console → Key Pairs"
echo "   - Verify security group allows SSH (port 22)"
echo "   - Try: ssh -i ~/.ssh/kidplay-arcade-key.pem ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com"
echo ""
echo "2. 🌐 AWS Systems Manager (If enabled):"
echo "   - Go to AWS Console → Systems Manager → Session Manager"
echo "   - Start session with your EC2 instance"
echo "   - Upload and run the emergency-server-fix.sh script"
echo ""
echo "3. 🔄 Instance Restart:"
echo "   - Go to AWS Console → EC2 → Instances"
echo "   - Select your instance (IP: 3.81.165.163)"
echo "   - Actions → Instance State → Restart"
echo "   - This might reset to the database-backed server"
echo ""
echo "4. 📦 Manual File Transfer:"
echo "   - Use AWS Console file transfer"
echo "   - Or SCP if SSH is fixed: scp -i ~/.ssh/kidplay-arcade-key.pem /tmp/$PACKAGE_NAME.tar.gz ec2-user@ec2-3-81-165-163.compute-1.amazonaws.com:~/"
echo ""

# Test current server status
echo "🔍 Current server status:"
echo "Testing: http://3.81.165.163:3001/api/health"
RESPONSE=$(curl -s "http://3.81.165.163:3001/api/health" || echo "NO_RESPONSE")
if echo "$RESPONSE" | grep -q "OK"; then
    echo "✅ Database server is working correctly!"
elif echo "$RESPONSE" | grep -q "Cannot GET"; then
    echo "⚠️  Server running but wrong configuration (needs fix)"
else
    echo "❌ Server not responding correctly"
fi

echo ""
echo "🎯 The goal is to get this response:"
echo '{"status":"OK","message":"KidPlay Arcade API is running","timestamp":"..."}'

# Copy package to current directory for easy access
cp "/tmp/$PACKAGE_NAME.tar.gz" "$PROJECT_ROOT/"
echo ""
echo "📋 Package also copied to: $PROJECT_ROOT/$PACKAGE_NAME.tar.gz"
