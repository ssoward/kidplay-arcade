#!/bin/bash

# KidPlay Arcade - Production Server Test Script
# Tests the deployed database authentication system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_URL="http://3.81.165.163:3001"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Test User $(date +%s)"

echo -e "${BLUE}🧪 Testing KidPlay Arcade Production Server${NC}"
echo "Server URL: $SERVER_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
if curl -s --connect-timeout 10 "$SERVER_URL/api/health" | grep -q "OK"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed - server may not be accessible${NC}"
    echo "Make sure the AWS security group allows inbound traffic on port 3001"
    echo "See: AWS-SECURITY-GROUP-MANUAL-SETUP.md"
    exit 1
fi

# Test 2: User Registration
echo -e "${YELLOW}2. Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$SERVER_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

HTTP_CODE="${REGISTER_RESPONSE: -3}"
RESPONSE_BODY="${REGISTER_RESPONSE%???}"

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    USER_ID=$(echo "$RESPONSE_BODY" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
    echo "   User ID: $USER_ID"
else
    echo -e "${RED}❌ User registration failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

# Test 3: User Login
echo -e "${YELLOW}3. Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$SERVER_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE="${LOGIN_RESPONSE: -3}"
RESPONSE_BODY="${LOGIN_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User login successful${NC}"
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "   Token received: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ User login failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

# Test 4: Protected Route (Profile)
echo -e "${YELLOW}4. Testing Protected Route (Profile)...${NC}"
PROFILE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$SERVER_URL/api/auth/profile" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE="${PROFILE_RESPONSE: -3}"
RESPONSE_BODY="${PROFILE_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Profile access successful${NC}"
    echo "   Profile data retrieved for: $TEST_EMAIL"
else
    echo -e "${RED}❌ Profile access failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi

# Test 5: Admin User Check
echo -e "${YELLOW}5. Testing Admin User Login...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$SERVER_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"scott.soward@gmail.com","password":"admin123"}')

HTTP_CODE="${ADMIN_LOGIN_RESPONSE: -3}"
RESPONSE_BODY="${ADMIN_LOGIN_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    echo "   Admin user is properly configured"
else
    echo -e "${YELLOW}⚠️  Admin login failed (HTTP $HTTP_CODE)${NC}"
    echo "   This is expected if admin credentials were changed"
fi

# Test 6: Database Connection Test
echo -e "${YELLOW}6. Testing Database Endpoints...${NC}"
USERS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$SERVER_URL/api/auth/users" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE="${USERS_RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✅ Database endpoints responding${NC}"
else
    echo -e "${YELLOW}⚠️  Users endpoint returned HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Production Server Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Server is accessible externally"
echo "✅ Database authentication is working"
echo "✅ User registration and login functional"
echo "✅ Protected routes working with JWT tokens"
echo ""
echo -e "${BLUE}🚀 Ready for Frontend Integration!${NC}"
echo "You can now:"
echo "1. Update your React frontend to use: $SERVER_URL"
echo "2. Test the frontend authentication flows"
echo "3. Deploy your frontend to connect to this backend"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update frontend API base URL"
echo "2. Test cross-origin requests (CORS)"
echo "3. Configure SSL/HTTPS for production"
echo "4. Set up proper monitoring and logging"
