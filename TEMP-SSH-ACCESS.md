# Temporary SSH Access for SSL Setup

## Add Your IP to Security Group

Run this AWS CLI command to temporarily allow SSH from your current IP:

```bash
# Add your current IP (66.118.45.124) to the security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-03291002d10b0d3c0 \
  --protocol tcp \
  --port 22 \
  --cidr 66.118.45.124/32 \
  --description "Temporary access for SSL setup"
```

## Or via AWS Console:

1. Go to **AWS Console → EC2 → Security Groups**
2. Find security group `sg-03291002d10b0d3c0` 
3. Click **Edit inbound rules**
4. Click **Add rule**
5. Set:
   - **Type:** SSH
   - **Protocol:** TCP  
   - **Port:** 22
   - **Source:** Custom - `66.118.45.124/32`
   - **Description:** Temporary access for SSL setup
6. Click **Save rules**

## After adding the rule, run SSL setup:

```bash
./setup-ssl.sh
```

## Remove temporary access after SSL setup:

```bash
# Remove the temporary rule after SSL is configured
aws ec2 revoke-security-group-ingress \
  --group-id sg-03291002d10b0d3c0 \
  --protocol tcp \
  --port 22 \
  --cidr 66.118.45.124/32
```

This is the safest approach since port 443 is already open and ready for HTTPS traffic!
