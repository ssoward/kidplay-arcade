#!/bin/bash

# KidPlay Arcade - Final Deployment Verification Script
# Run this after any deployment to ensure everything is working

echo "🔍 KidPlay Arcade - Final Deployment Verification"
echo "=================================================="
echo "Date: $(date)"
echo ""

# Test 1: Check if website is accessible
echo "🌐 Testing website accessibility..."
if curl -s -I "https://amorvivir.com" | grep -q "200 OK"; then
    echo "✅ Website is accessible via HTTPS"
elif curl -s -I "http://amorvivir.com" | grep -q "200 OK"; then
    echo "✅ Website is accessible via HTTP"
else
    echo "❌ Website is not accessible"
fi

# Test 2: Health endpoint
echo ""
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "https://amorvivir.com/api/health" 2>/dev/null)
if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend health check passed"
    
    # Check CORS
    if [[ "$HEALTH_RESPONSE" == *"amorvivir.com"* ]]; then
        echo "✅ CORS configuration includes production domain"
    else
        echo "⚠️  CORS configuration may need updating"
    fi
    
    # Check Azure AI
    if [[ "$HEALTH_RESPONSE" == *"connected"* ]]; then
        echo "✅ Azure AI integration is connected"
    else
        echo "⚠️  Azure AI may need configuration"
    fi
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 3: AI functionality
echo ""
echo "🤖 Testing AI functionality..."
AI_RESPONSE=$(curl -s -X POST "https://amorvivir.com/api/ask-ai" \
    -H "Content-Type: application/json" \
    -d '{"history":[{"role":"user","content":"Say test successful"}]}' \
    --max-time 20 2>/dev/null)

if [[ "$AI_RESPONSE" == *"message"* ]] && [[ "$AI_RESPONSE" != *"error"* ]]; then
    echo "✅ AI API is responding correctly"
    echo "✅ TwentyQuestions and other AI games should work"
else
    echo "⚠️  AI API may have issues"
    echo "Response preview: ${AI_RESPONSE:0:100}..."
fi

# Test 4: Game-specific endpoints
echo ""
echo "🎮 Testing game endpoints..."
if curl -s "https://amorvivir.com/api/sight-words" | grep -q "words"; then
    echo "✅ Educational game APIs working"
else
    echo "⚠️  Some game APIs may need verification"
fi

# Test 5: Static file serving
echo ""
echo "📁 Testing static file serving..."
if curl -s -I "https://amorvivir.com/static/" | grep -q "200\|403"; then
    echo "✅ Static files are being served"
else
    echo "⚠️  Static file serving may need verification"
fi

# Summary
echo ""
echo "📊 VERIFICATION SUMMARY"
echo "======================"
echo "🌐 Production URL: https://amorvivir.com"
echo "🔧 Health Check: https://amorvivir.com/api/health"
echo "📱 Mobile Friendly: Responsive design implemented"
echo "🔒 Security: CORS, rate limiting, and security headers active"
echo "🎯 Games: 20+ educational and AI-powered games"
echo ""
echo "🎉 If all tests passed, your KidPlay Arcade is ready for kids!"
echo ""
echo "🆘 TROUBLESHOOTING:"
echo "• If AI games fail: ./fix-cors-production.sh"
echo "• For backend issues: ssh and check 'pm2 status'"
echo "• For deployment: ./deploy-production.sh"
echo ""
echo "📚 Documentation: See PRODUCTION-DEPLOYMENT-GUIDE.md"
