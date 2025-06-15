#!/bin/bash
# KidPlay Arcade - Database Authentication AWS Deployment Script
# This script deploys the application with database integration to an AWS server

# Text color variables
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Server configuration
AWS_HOST="ec2-3-81-165-163.compute-1.amazonaws.com"  # Updated to use hostname
PEM_PATH="/Users/ssoward/.ssh/kidplay-arcade-key.pem"  # Path to your PEM file
SSH_USER="ec2-user"  # Default user for Amazon Linux instances

# Archive the application
echo -e "${BLUE}📦 Packaging the application...${NC}"
tar -czf kidplay-arcade-db-auth.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.tar.gz' \
    --exclude='build' \
    backend/ \
    public/ \
    src/ \
    package.json \
    package-lock.json \
    setup-db-auth.sh \
    ecosystem.config.js

# Check if the archive was created successfully
if [ ! -f kidplay-arcade-db-auth.tar.gz ]; then
    echo -e "${RED}❌ Failed to create archive. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application packaged successfully.${NC}"

# Create the remote deployment script
echo -e "${BLUE}🔧 Creating remote deployment script...${NC}"
cat > remote-deploy.sh << 'EOT'
#!/bin/bash

echo "🚀 Starting KidPlay Arcade with DB Authentication deployment on AWS EC2..."

# Update system
echo "🔄 Updating system packages..."
sudo yum update -y

# Install Node.js
echo "📥 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 16
    nvm use 16
else
    echo "✅ Node.js is already installed."
fi

# Install PM2 for process management
echo "📥 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "✅ PM2 is already installed."
fi

# Install SQLite if not already installed
echo "📥 Installing SQLite..."
if ! command -v sqlite3 &> /dev/null; then
    sudo yum install -y sqlite
else
    echo "✅ SQLite is already installed."
fi

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p ~/kidplay-arcade
cd ~/kidplay-arcade

# Extract the application
echo "📦 Extracting application files..."
tar -xzf ~/kidplay-arcade-db-auth.tar.gz

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..

# Build the React app
echo "🔨 Building React app..."
npm run build

# Set up environment variables
echo "🔧 Setting up environment..."
cat > .env << EOF
# Environment variables
AZURE_OPENAI_KEY=your-azure-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-03-15-preview
PORT=3001
NODE_ENV=production
EOF
echo "⚠️  IMPORTANT: Edit .env with your actual Azure credentials for AI features!"

# Set up database
echo "🗄️ Setting up database..."
chmod +x setup-db-auth.sh
./setup-db-auth.sh

# Configure PM2 to use the database-integrated server
echo "📋 Updating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'kidplay-arcade',
    script: 'backend/server-with-db-auth.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Stop any existing PM2 processes
pm2 stop all || true
pm2 delete all || true

# Start the application with PM2
echo "🚀 Starting the application..."
pm2 start ecosystem.config.js --env production
pm2 save

# Set up PM2 to start on boot
echo "🔄 Setting up PM2 startup script..."
pm2 startup | tail -n 1 | bash

echo "✅ Deployment complete! The application should be running at http://$HOSTNAME:3001"
echo "✅ Database is set up and integrated with user authentication."
EOT

# Make the remote deployment script executable
chmod +x remote-deploy.sh

# Transfer the application archive and deployment script to the AWS server
echo -e "${BLUE}📤 Transferring files to AWS server...${NC}"
scp -i "$PEM_PATH" -o StrictHostKeyChecking=no \
    kidplay-arcade-db-auth.tar.gz \
    remote-deploy.sh \
    $SSH_USER@$AWS_HOST:~

# Execute the remote deployment script on the AWS server
echo -e "${BLUE}🚀 Starting remote deployment...${NC}"
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no $SSH_USER@$AWS_HOST "bash remote-deploy.sh"

# Clean up local files
rm kidplay-arcade-db-auth.tar.gz
rm remote-deploy.sh

echo -e "${GREEN}✅ Deployment process completed!${NC}"
echo -e "${BLUE}💻 The application should be accessible at:${NC} http://$AWS_IP:3001"
echo -e "${YELLOW}NOTE: You may need to configure your security group to allow traffic on port 3001.${NC}"
echo -e "${YELLOW}NOTE: Database files are stored on the server at ~/kidplay-arcade/backend/kidplay_arcade.db${NC}"
