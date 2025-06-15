# AWS Credentials Setup for KidPlay Arcade Deployment

## Current Status
The AWS CLI is configured but the credentials appear to be expired or invalid.

## Required Credentials
You need valid AWS credentials with the following permissions:
- EC2 instance creation and management
- Security group creation and management
- Key pair creation and management
- Elastic IP allocation and management

## Option 1: Use AWS Console to Generate New Credentials

1. **Log into AWS Console**: https://aws.amazon.com/console/
2. **Go to IAM Service**: Search for "IAM" in the services
3. **Create or Select User**: 
   - If you have an existing user, select it
   - If not, create a new user for this deployment
4. **Generate Access Keys**:
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Save both Access Key ID and Secret Access Key

## Option 2: Use Existing Valid Credentials

If you have valid AWS credentials from another source, you can set them up:

```bash
aws configure set aws_access_key_id YOUR_ACCESS_KEY_ID
aws configure set aws_secret_access_key YOUR_SECRET_ACCESS_KEY
aws configure set region us-east-1
```

## Option 3: Use AWS SSO/Profile

If your organization uses AWS SSO, you may need to:

```bash
aws sso login --profile your-profile-name
aws configure set profile.default.sso_session your-session-name
```

## Test Credentials

After setting up credentials, test them:

```bash
aws sts get-caller-identity
```

This should return your account information without errors.

## Next Steps

Once valid credentials are configured, run:

```bash
./deploy-simple.sh
```

This will create your AWS instance and deploy KidPlay Arcade.

## Alternative: Manual Instance Creation

If AWS CLI continues to have issues, you can manually create an EC2 instance through the AWS Console and then use the deployment scripts to configure it.

## Security Note

- Keep your AWS credentials secure
- Don't commit them to version control
- Consider using IAM roles with minimal required permissions
- Rotate credentials regularly
