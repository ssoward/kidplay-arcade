#!/bin/bash

# KidPlay Arcade AWS Credentials Troubleshoot & Deploy
# This script helps diagnose and fix AWS credential issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🔧 KidPlay Arcade - AWS Credentials Troubleshooter${NC}"
echo ""

# Function to test AWS credentials
test_aws_credentials() {
    local profile=${1:-"default"}
    echo -e "${BLUE}Testing AWS credentials for profile: $profile${NC}"
    
    if [ "$profile" = "default" ]; then
        aws sts get-caller-identity 2>/dev/null
    else
        aws sts get-caller-identity --profile "$profile" 2>/dev/null
    fi
}

# Function to list all profiles
list_profiles() {
    echo -e "${BLUE}Available AWS profiles:${NC}"
    aws configure list-profiles 2>/dev/null || echo "No profiles found"
}

# Function to check credentials file
check_credentials_file() {
    echo -e "${BLUE}Checking credentials file:${NC}"
    if [ -f ~/.aws/credentials ]; then
        echo -e "${GREEN}✅ Credentials file exists${NC}"
        echo -e "${YELLOW}Profile sections found:${NC}"
        grep '^\[' ~/.aws/credentials || echo "No profile sections found"
    else
        echo -e "${RED}❌ No credentials file found at ~/.aws/credentials${NC}"
    fi
}

# Function to try different profiles
try_profiles() {
    local profiles=($(aws configure list-profiles 2>/dev/null))
    
    for profile in "${profiles[@]}"; do
        echo -e "${YELLOW}Trying profile: $profile${NC}"
        if test_aws_credentials "$profile" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Profile '$profile' works!${NC}"
            
            # Ask if user wants to use this profile
            read -p "Use this profile for deployment? (y/n): " use_profile
            if [[ $use_profile =~ ^[Yy]$ ]]; then
                export AWS_PROFILE="$profile"
                echo -e "${GREEN}Using profile: $profile${NC}"
                return 0
            fi
        else
            echo -e "${RED}❌ Profile '$profile' failed${NC}"
        fi
        echo ""
    done
    
    return 1
}

# Function to setup new credentials
setup_new_credentials() {
    echo -e "${YELLOW}Setting up new AWS credentials${NC}"
    echo -e "${BLUE}You'll need:${NC}"
    echo "1. AWS Access Key ID"
    echo "2. AWS Secret Access Key"
    echo "3. AWS Region (us-east-1 recommended)"
    echo ""
    
    read -p "Do you want to configure new credentials now? (y/n): " setup_creds
    if [[ $setup_creds =~ ^[Yy]$ ]]; then
        aws configure
        
        # Test the new credentials
        if test_aws_credentials >/dev/null 2>&1; then
            echo -e "${GREEN}✅ New credentials work!${NC}"
            return 0
        else
            echo -e "${RED}❌ New credentials failed to authenticate${NC}"
            return 1
        fi
    fi
    
    return 1
}

# Main troubleshooting flow
main() {
    echo -e "${BLUE}Step 1: Checking AWS CLI installation${NC}"
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not installed${NC}"
        echo -e "${YELLOW}Install with: brew install awscli${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
    echo ""
    
    echo -e "${BLUE}Step 2: Checking credentials file${NC}"
    check_credentials_file
    echo ""
    
    echo -e "${BLUE}Step 3: Listing available profiles${NC}"
    list_profiles
    echo ""
    
    echo -e "${BLUE}Step 4: Testing default credentials${NC}"
    if test_aws_credentials >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Default credentials work!${NC}"
        echo -e "${BLUE}Account info:${NC}"
        test_aws_credentials
        echo ""
        
        read -p "Proceed with deployment using default credentials? (y/n): " proceed
        if [[ $proceed =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}🚀 Starting deployment...${NC}"
            ./deploy-simple.sh
            exit 0
        fi
    else
        echo -e "${RED}❌ Default credentials failed${NC}"
        echo ""
        
        echo -e "${BLUE}Step 5: Trying other profiles${NC}"
        if try_profiles; then
            echo -e "${GREEN}🚀 Starting deployment with selected profile...${NC}"
            ./deploy-simple.sh
            exit 0
        fi
        
        echo -e "${BLUE}Step 6: Setup new credentials${NC}"
        if setup_new_credentials; then
            echo -e "${GREEN}🚀 Starting deployment with new credentials...${NC}"
            ./deploy-simple.sh
            exit 0
        fi
    fi
    
    echo -e "${RED}❌ Could not establish working AWS credentials${NC}"
    echo -e "${YELLOW}Please check the AWS-CREDENTIALS-SETUP.md guide${NC}"
    echo -e "${YELLOW}Or set up credentials manually with: aws configure${NC}"
}

# Run main function
main
