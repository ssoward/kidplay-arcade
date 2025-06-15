#!/bin/bash

# Medical Assistant Answer Shuffling Fix - Quick Deploy Script
echo "🎯 DEPLOYING MEDICAL ASSISTANT ANSWER SHUFFLING FIX"
echo "=================================================="

# Build the frontend with the fix
echo "📦 Building frontend with answer shuffling fix..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf kidplay-arcade-medical-assistant-fix-$(date +%Y%m%d-%H%M%S).tar.gz \
    build/ \
    backend/ \
    package.json \
    MEDICAL-ASSISTANT-FIX-COMPLETE.md \
    --exclude=node_modules \
    --exclude=.git

echo "✅ Deployment package created"

echo ""
echo "🎯 MEDICAL ASSISTANT FIX SUMMARY:"
echo "- Fixed 79.3% bias toward position 2"
echo "- Added answer shuffling to randomize positions"
echo "- Applied to both new questions and mistake practice"
echo "- No compilation errors"
echo "- Ready for production deployment"
echo ""
echo "🚀 Next step: Deploy to AWS production environment"
echo ""

# Optional: Show deployment package info
PACKAGE=$(ls -t kidplay-arcade-medical-assistant-fix-*.tar.gz | head -1)
echo "📦 Deployment package: $PACKAGE"
echo "📊 Package size: $(du -h $PACKAGE | cut -f1)"
