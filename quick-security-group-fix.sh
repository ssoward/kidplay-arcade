#!/bin/bash

# Quick AWS Security Group Fix
# This script provides the exact steps to enable external access to your KidPlay Arcade server

echo "🔧 KidPlay Arcade - AWS Security Group Quick Fix"
echo "=============================================="
echo ""
echo "Your server is running perfectly at 3.81.165.163 but external access is blocked."
echo "Follow these steps to fix it:"
echo ""

echo "📋 MANUAL METHOD (Recommended):"
echo "1. Go to: https://console.aws.amazon.com/ec2/"
echo "2. Sign in to your AWS account"
echo "3. Navigate to: EC2 Dashboard → Security Groups"
echo "4. Find the security group for your instance with IP: 3.81.165.163"
echo "5. Click on the security group"
echo "6. Click 'Edit inbound rules'"
echo "7. Click 'Add rule'"
echo "8. Set up the new rule:"
echo "   - Type: Custom TCP"
echo "   - Port range: 3001"
echo "   - Source: 0.0.0.0/0"
echo "   - Description: KidPlay Arcade Web Server"
echo "9. Click 'Save rules'"
echo ""

echo "⏰ AUTOMATED METHOD (If AWS CLI works):"
echo "First test if AWS CLI works:"
echo "  aws sts get-caller-identity"
echo ""
echo "If it works, run:"
echo "  ./configure-aws-security-group.sh"
echo ""

echo "🧪 VERIFICATION:"
echo "After fixing the security group, test with:"
echo "  curl \"http://3.81.165.163:3001/api/health\""
echo ""
echo "Expected response:"
echo '  {"status":"OK","message":"KidPlay Arcade API is running"}'
echo ""

echo "🚀 ONCE FIXED, RUN:"
echo "  ./test-production-server.sh    # Test backend"
echo "  npm run start:prod             # Test frontend"
echo ""

# Test current status
echo "🔍 CURRENT STATUS CHECK:"
echo "Testing if port 3001 is accessible..."

if curl -s --connect-timeout 5 "http://3.81.165.163:3001/api/health" >/dev/null 2>&1; then
    echo "✅ SUCCESS: Port 3001 is already accessible!"
    echo "🎉 Your KidPlay Arcade server is ready to use!"
    echo "   URL: http://3.81.165.163:3001"
else
    echo "❌ BLOCKED: Port 3001 is not accessible (as expected)"
    echo "📝 Please follow the manual steps above to fix the AWS Security Group"
fi

echo ""
echo "💡 NOTE: The cache errors you see in the browser console are from browser"
echo "   extensions and don't affect your KidPlay Arcade application."
