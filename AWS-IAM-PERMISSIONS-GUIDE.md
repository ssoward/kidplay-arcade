# AWS IAM Permissions for KidPlay Arcade Deployment

## 🎯 Required AWS Permissions

To deploy KidPlay Arcade, your IAM user needs the following permissions:

### 📋 Option 1: Minimum Required Permissions (Recommended)

Create a custom policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EC2InstanceManagement",
            "Effect": "Allow",
            "Action": [
                "ec2:RunInstances",
                "ec2:TerminateInstances",
                "ec2:StartInstances",
                "ec2:StopInstances",
                "ec2:RebootInstances",
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeImages",
                "ec2:DescribeInstanceAttribute",
                "ec2:ModifyInstanceAttribute"
            ],
            "Resource": "*"
        },
        {
            "Sid": "KeyPairManagement",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateKeyPair",
                "ec2:DeleteKeyPair",
                "ec2:DescribeKeyPairs"
            ],
            "Resource": "*"
        },
        {
            "Sid": "SecurityGroupManagement",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateSecurityGroup",
                "ec2:DeleteSecurityGroup",
                "ec2:DescribeSecurityGroups",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:AuthorizeSecurityGroupEgress",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:RevokeSecurityGroupEgress"
            ],
            "Resource": "*"
        },
        {
            "Sid": "TaggingSupport",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateTags",
                "ec2:DescribeTags"
            ],
            "Resource": "*"
        },
        {
            "Sid": "NetworkInfo",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeVpcs",
                "ec2:DescribeSubnets",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DescribeAvailabilityZones"
            ],
            "Resource": "*"
        },
        {
            "Sid": "STSAccess",
            "Effect": "Allow",
            "Action": [
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

### 🚀 Option 2: AWS Managed Policies (Easier Setup)

Attach these AWS managed policies to your IAM user:

1. **`AmazonEC2FullAccess`** - For EC2 instance management
2. **`IAMReadOnlyAccess`** - For identity verification

**⚠️ Note:** This gives broader permissions than needed but is simpler to set up.

### 🛡️ Option 3: Minimal Production Policy (Most Secure)

For production deployments, use this more restrictive policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:RunInstances",
                "ec2:DescribeInstances",
                "ec2:DescribeImages",
                "ec2:CreateKeyPair",
                "ec2:DescribeKeyPairs",
                "ec2:CreateSecurityGroup",
                "ec2:DescribeSecurityGroups",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:CreateTags",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": ["us-east-1", "us-west-2"]
                }
            }
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:TerminateInstances",
                "ec2:StopInstances",
                "ec2:StartInstances"
            ],
            "Resource": "arn:aws:ec2:*:*:instance/*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/Name": "KidPlay-Arcade*"
                }
            }
        }
    ]
}
```

## 🔧 How to Set Up IAM Permissions

### Step 1: Create IAM User (if needed)

1. Go to **AWS Console** → **IAM** → **Users**
2. Click **"Add user"**
3. Enter username (e.g., `kidplay-deploy`)
4. Select **"Programmatic access"**
5. Click **"Next: Permissions"**

### Step 2: Attach Permissions

**Option A: Use Managed Policies (Recommended for beginners)**
1. Select **"Attach existing policies directly"**
2. Search and select: **`AmazonEC2FullAccess`**
3. Click **"Next"** → **"Create user"**

**Option B: Create Custom Policy (Recommended for security)**
1. Select **"Attach existing policies directly"**
2. Click **"Create policy"**
3. Choose **"JSON"** tab
4. Paste the JSON from Option 1 above
5. Name it `KidPlayArcadeDeployment`
6. Save and attach to your user

### Step 3: Get Access Keys

1. After creating the user, **download the CSV** with:
   - Access Key ID
   - Secret Access Key
2. **Save these securely** - you'll need them for `aws configure`

## 💻 Configure AWS CLI

Once you have your access keys:

```bash
aws configure
```

Enter:
- **AWS Access Key ID:** [Your access key]
- **AWS Secret Access Key:** [Your secret key]
- **Default region:** `us-east-1`
- **Default output format:** `json`

## ✅ Test Your Configuration

```bash
# Test if AWS CLI is working
aws sts get-caller-identity

# Test EC2 permissions
aws ec2 describe-instances --region us-east-1
```

## 🎯 Ready to Deploy!

Once your IAM permissions are set up, you can run:

```bash
./deploy-simple.sh
```

## 🆘 Troubleshooting IAM Issues

### Common Error Messages:

1. **"UnauthorizedOperation: You are not authorized to perform this operation"**
   - Add the missing permission to your IAM policy
   - Check the AWS CloudTrail logs for the exact permission needed

2. **"InvalidUserID.NotFound"**
   - Your Access Key ID is incorrect
   - Regenerate access keys in IAM console

3. **"SignatureDoesNotMatch"**
   - Your Secret Access Key is incorrect
   - Check for extra spaces or characters

4. **"AccessDenied"**
   - Your IAM user doesn't have the required permissions
   - Add the permissions listed above

### Debug Commands:

```bash
# Check your current identity
aws sts get-caller-identity

# Test specific permissions
aws ec2 describe-instances --dry-run

# Check your configuration
aws configure list
```

## 💡 Security Best Practices

1. **Use least privilege:** Start with minimal permissions and add as needed
2. **Regular rotation:** Rotate access keys every 90 days
3. **MFA recommended:** Enable MFA on your AWS account
4. **Don't hardcode keys:** Never put access keys in your code
5. **Monitor usage:** Check AWS CloudTrail for unusual activity

---

**🎉 Once set up, your deployment script will handle everything automatically!**
