#!/bin/bash

# Simple AI fix script for EC2 instance
echo "🔧 Fixing AI endpoints..."

# Make sure we're in the right directory
cd /home/ec2-user/kidplay-arcade

# Set up Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Check if the environment file exists and copy it if needed
if [ ! -f backend/.env ]; then
    cp .env.production backend/.env
    echo "✅ Copied environment file"
fi

# Try starting app.js directly to test
echo "Testing app.js startup..."
cd backend
timeout 5 node app.js &
APP_PID=$!
sleep 2
if ps -p $APP_PID > /dev/null; then
    echo "✅ app.js can start"
    kill $APP_PID
else
    echo "❌ app.js failed to start"
    echo "Trying server.js instead..."
    timeout 5 node server.js &
    SERVER_PID=$!
    sleep 2
    if ps -p $SERVER_PID > /dev/null; then
        echo "✅ server.js works"
        kill $SERVER_PID
        USE_SERVER=true
    else
        echo "❌ server.js also failed"
        kill $SERVER_PID 2>/dev/null
    fi
fi

# Start with PM2
cd /home/ec2-user/kidplay-arcade
if [ "$USE_SERVER" = "true" ]; then
    echo "Starting server.js with PM2..."
    pm2 start backend/server.js --name kidplay-arcade
else
    echo "Starting app.js with PM2..."
    pm2 start backend/app.js --name kidplay-arcade
fi

# Save PM2 configuration
pm2 save

echo "✅ Backend restarted"
pm2 status
