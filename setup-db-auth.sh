#!/bin/bash

# KidPlay Arcade - Database Authentication Implementation Script
# This script sets up the necessary components for database-backed user authentication

# Text color variables
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 KidPlay Arcade - Database Authentication Setup${NC}"

# Installing dependencies
echo -e "${YELLOW}Installing required dependencies...${NC}"
npm install sqlite3 bcryptjs --save

# Setting up configuration
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p backend/logs

# Make scripts executable
echo -e "${YELLOW}Making test scripts executable...${NC}"
chmod +x backend/test-db-auth.js
chmod +x backend/test-db-integration.js

# Ensure the deploy script is executable
echo -e "${YELLOW}Configuring deployment scripts...${NC}"
chmod +x deploy-to-aws.sh

# Start the server with new implementation
echo -e "${GREEN}✅ Setup complete! Here's how to run the system:${NC}"
echo -e "${BLUE}- Start the server with database auth:${NC} node backend/server-with-db-auth.js"
echo -e "${BLUE}- Test the database implementation:${NC} ./backend/test-db-auth.js"
echo -e "${BLUE}- Deploy to AWS:${NC} ./deploy-to-aws.sh"
echo ""
echo -e "${YELLOW}NOTE: The deployment script already includes the target IP address (3.81.165.163).${NC}"
echo -e "${YELLOW}NOTE: You may need to modify your main server.js to include the user-auth-routes.js module.${NC}"
echo ""
