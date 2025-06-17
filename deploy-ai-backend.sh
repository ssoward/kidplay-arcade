#!/bin/bash

# Deploy AI-enabled backend to AWS EC2
set -e

echo "🚀 Deploying AI-enabled backend to AWS EC2..."

# Build the React app first
echo "📦 Building React frontend..."
npm run build

# Define remote details
REMOTE_HOST="ec2-3-145-53-146.us-east-2.compute.amazonaws.com"
REMOTE_USER="ubuntu"
KEY_PATH="$HOME/.ssh/kidplay-arcade-key-new.pem"
REMOTE_APP_DIR="/home/ubuntu/kidplay-arcade"

echo "📤 Uploading updated backend files to EC2..."

# Upload the updated backend files
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    backend/server.js \
    backend/package.json \
    package.json \
    package-lock.json \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

# Upload the backend folder structure
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r \
    backend/ \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

# Upload the updated build files
echo "📤 Uploading frontend build..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r \
    build/ \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

echo "🔧 Updating dependencies and restarting services on EC2..."

# SSH into EC2 and update the backend
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
cd /home/ubuntu/kidplay-arcade

echo "📦 Installing backend dependencies..."
cd backend && npm install --production
cd ..

echo "📦 Installing main dependencies (including sqlite3)..."
npm install --production

echo "🔄 Stopping existing PM2 processes..."
pm2 stop all || true
pm2 delete all || true

echo "🚀 Starting updated backend with PM2..."
pm2 start backend/server.js --name "kidplay-backend"

echo "📋 PM2 Status:"
pm2 status

echo "🏗️ Updating nginx files..."
sudo cp build/* /usr/share/nginx/html/ 2>/dev/null || true
sudo systemctl reload nginx

echo "✅ Deployment complete!"

echo "🧪 Testing AI endpoint..."
curl -s -X POST http://localhost:3001/api/ask-ai \
  -H "Content-Type: application/json" \
  -d '{"history":[{"role":"user","content":"Hello!"}]}' \
  | head -c 200

echo ""
echo "🌐 Testing frontend..."
curl -s -I http://localhost | head -n 1

echo ""
echo "📊 Backend logs (last 10 lines):"
pm2 logs kidplay-backend --lines 10

EOF

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Frontend: http://3.145.53.146"
echo "🤖 AI Endpoint: http://3.145.53.146/api/ask-ai"
echo ""
echo "🧪 Test the AI endpoint with:"
echo "curl -X POST http://3.145.53.146/api/ask-ai -H 'Content-Type: application/json' -d '{\"history\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
