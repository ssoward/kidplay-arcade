#!/bin/bash

# Deploy AI-enabled backend to AWS EC2 - Enhanced version with SSH key fallback
set -e

echo "🚀 Deploying AI-enabled backend to AWS EC2..."

# Build the React app first
echo "📦 Building React frontend..."
npm run build

# Define remote details
REMOTE_HOST="3.145.53.146"
REMOTE_HOST_DNS="ec2-3-145-53-146.us-east-2.compute.amazonaws.com" 
REMOTE_USER="ubuntu"
REMOTE_APP_DIR="/home/ubuntu/kidplay-arcade"

# Try different SSH keys
SSH_KEYS=(
    "$HOME/.ssh/kidplay-arcade-key.pem"
    "$HOME/.ssh/kidplay-arcade-key-new.pem"
)

WORKING_KEY=""

echo "🔐 Testing SSH keys..."
for key in "${SSH_KEYS[@]}"; do
    if [ -f "$key" ]; then
        echo "Testing key: $key"
        if ssh -i "$key" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" 'echo "SSH works"' 2>/dev/null; then
            WORKING_KEY="$key"
            echo "✅ Working SSH key found: $key"
            break
        else
            echo "❌ Key failed: $key"
        fi
    else
        echo "❌ Key not found: $key"
    fi
done

if [ -z "$WORKING_KEY" ]; then
    echo "❌ No working SSH key found. Available keys:"
    ls -la ~/.ssh/kidplay-arcade* 2>/dev/null || echo "No kidplay SSH keys found"
    echo ""
    echo "🧪 Testing current API endpoint status..."
    echo "Frontend test:"
    curl -I "http://$REMOTE_HOST" | head -n 3
    echo ""
    echo "API test:"
    curl -X POST "http://$REMOTE_HOST/api/ask-ai" \
         -H "Content-Type: application/json" \
         -d '{"history":[{"role":"user","content":"test"}]}' \
         --max-time 5 -I | head -n 3 || echo "API endpoint not responding"
    echo ""
    echo "📋 Manual SSH Instructions:"
    echo "1. Check AWS EC2 console for the correct key name"
    echo "2. Ensure the key is downloaded and has correct permissions (chmod 400)"
    echo "3. Try: ssh -i /path/to/key.pem ubuntu@$REMOTE_HOST"
    echo ""
    echo "🔧 Alternative: Use AWS Session Manager or EC2 Instance Connect"
    exit 1
fi

echo "📤 Uploading updated backend files to EC2..."

# Upload the updated backend files
scp -i "$WORKING_KEY" -o StrictHostKeyChecking=no \
    backend/server.js \
    package.json \
    package-lock.json \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

# Upload the backend folder structure
scp -i "$WORKING_KEY" -o StrictHostKeyChecking=no -r \
    backend/ \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

# Upload the updated build files
echo "📤 Uploading frontend build..."
scp -i "$WORKING_KEY" -o StrictHostKeyChecking=no -r \
    build/ \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_DIR/"

echo "🔧 Updating dependencies and restarting services on EC2..."

# SSH into EC2 and update the backend
ssh -i "$WORKING_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
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

echo "🧪 Testing AI endpoint locally..."
sleep 2
curl -s -X POST http://localhost:3001/api/ask-ai \
  -H "Content-Type: application/json" \
  -d '{"history":[{"role":"user","content":"Hello!"}]}' \
  --max-time 10 | head -c 200 || echo "Local AI test failed"

echo ""
echo "🌐 Testing frontend..."
curl -s -I http://localhost | head -n 1

echo ""
echo "📊 Backend logs (last 10 lines):"
pm2 logs kidplay-backend --lines 10 --no-interactive || echo "Could not fetch logs"

EOF

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Frontend: http://$REMOTE_HOST"
echo "🤖 AI Endpoint: http://$REMOTE_HOST/api/ask-ai"
echo ""
echo "🧪 Testing deployed AI endpoint..."
sleep 3
curl -X POST "http://$REMOTE_HOST/api/ask-ai" \
     -H "Content-Type: application/json" \
     -d '{"history":[{"role":"user","content":"Hello! Can you say hi?"}]}' \
     --max-time 10 | head -c 200 || echo "Remote AI test failed"

echo ""
echo "📋 Test commands:"
echo "curl -X POST http://$REMOTE_HOST/api/ask-ai -H 'Content-Type: application/json' -d '{\"history\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
