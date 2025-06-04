#!/bin/bash

# Frontend Production Configuration Script
# Updates the React frontend to connect to the production backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PRODUCTION_API_URL="http://3.81.165.163:3001"
PROJECT_ROOT="/Users/ssoward/sandbox/workspace/FamilySearch/kidplay-arcade"

echo -e "${BLUE}🔧 Configuring Frontend for Production Backend${NC}"
echo "Production API URL: $PRODUCTION_API_URL"
echo ""

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${RED}❌ Error: Could not find package.json in $PROJECT_ROOT${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# 1. Update API base URL in services
echo -e "${YELLOW}1. Updating API service configurations...${NC}"

# Find all TypeScript/JavaScript files that might contain API URLs
API_FILES=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -E "(service|api|config)" | head -10)

echo "Found potential API configuration files:"
for file in $API_FILES; do
    echo "  - $file"
done

# 2. Create production environment file
echo -e "${YELLOW}2. Creating production environment configuration...${NC}"

cat > .env.production << EOF
# Production Environment Configuration
REACT_APP_API_BASE_URL=$PRODUCTION_API_URL
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=10000
EOF

echo -e "${GREEN}✅ Created .env.production${NC}"

# 3. Create or update API configuration
echo -e "${YELLOW}3. Creating centralized API configuration...${NC}"

mkdir -p src/config

cat > src/config/api.ts << 'EOF'
// API Configuration for KidPlay Arcade
// Automatically detects environment and uses appropriate API URL

const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // Production default
  return 'http://3.81.165.163:3001';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
      LOGOUT: '/api/auth/logout',
      UPDATE_PROFILE: '/api/auth/update-profile',
      CHANGE_PASSWORD: '/api/auth/change-password',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password'
    },
    HEALTH: '/api/health',
    GAMES: '/api/games',
    ITUNES: '/api/itunes/search'
  }
};

export default API_CONFIG;
EOF

echo -e "${GREEN}✅ Created src/config/api.ts${NC}"

# 4. Update package.json scripts for production
echo -e "${YELLOW}4. Adding production build scripts...${NC}"

# Add production-specific scripts to package.json
if command -v jq &> /dev/null; then
    jq '.scripts["build:prod"] = "REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm run build"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["start:prod"] = "REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm start"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo -e "${GREEN}✅ Updated package.json scripts${NC}"
else
    echo -e "${YELLOW}⚠️  jq not found, manually add these scripts to package.json:${NC}"
    echo '  "build:prod": "REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm run build"'
    echo '  "start:prod": "REACT_APP_API_BASE_URL=http://3.81.165.163:3001 npm start"'
fi

# 5. Create a test component to verify API connection
echo -e "${YELLOW}5. Creating API connection test component...${NC}"

cat > src/components/ProductionTest.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

const ProductionTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: HealthResponse = await response.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHealthStatus(null);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        🧪 Production API Test
      </h3>
      
      <div className="space-y-2">
        <p><strong>API URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        
        {loading && (
          <div className="text-blue-600">
            ⏳ Testing connection...
          </div>
        )}
        
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded">
            ❌ Connection Error: {error}
            <br />
            <small>Make sure the AWS security group allows port 3001</small>
          </div>
        )}
        
        {healthStatus && (
          <div className="text-green-600 bg-green-50 p-2 rounded">
            ✅ Connected Successfully!
            <br />
            Status: {healthStatus.status}
            <br />
            Message: {healthStatus.message}
            <br />
            Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionTest;
EOF

echo -e "${GREEN}✅ Created ProductionTest component${NC}"

echo ""
echo -e "${GREEN}🎉 Frontend Production Configuration Complete!${NC}"
echo ""
echo -e "${BLUE}📋 What was configured:${NC}"
echo "✅ Created .env.production with production API URL"
echo "✅ Created centralized API configuration (src/config/api.ts)"
echo "✅ Added production build scripts to package.json"
echo "✅ Created ProductionTest component for API verification"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. First, fix the AWS security group (see AWS-SECURITY-GROUP-MANUAL-SETUP.md)"
echo "2. Test the backend: ./test-production-server.sh"
echo "3. Update your components to use API_CONFIG instead of hardcoded URLs"
echo "4. Test the frontend: npm run start:prod"
echo "5. Build for production: npm run build:prod"
echo ""
echo -e "${YELLOW}📝 To use the new API configuration in your components:${NC}"
echo 'import API_CONFIG from "../config/api";'
echo 'const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, ...)'
echo ""
echo -e "${YELLOW}🧪 To test the API connection, add ProductionTest to your app:${NC}"
echo 'import ProductionTest from "./components/ProductionTest";'
echo 'Add <ProductionTest /> to your App.tsx temporarily'
EOF
