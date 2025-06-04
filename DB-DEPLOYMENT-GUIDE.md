# KidPlay Arcade Database Deployment Guide

This document outlines the process for deploying the KidPlay Arcade application with SQLite database integration for user authentication.

## Database Integration Overview

The application now uses SQLite for user authentication instead of in-memory storage. This provides:

- Persistent user data across server restarts
- More secure password storage with bcrypt hashing
- Support for additional user profile fields
- Database-backed authentication flows

## Deployment Process

### Prerequisites

- AWS EC2 instance with Amazon Linux 2 or newer
- SSH access to the EC2 instance
- Proper security group settings (port 3001 open)
- PEM key file for SSH authentication

### Deployment Steps

1. **Run the deployment script**:
   
   ```bash
   ./deploy-db-auth-to-aws.sh
   ```

   This script will:
   - Package the application excluding unnecessary files
   - Transfer the package to your AWS server
   - Install required dependencies (Node.js, SQLite, PM2)
   - Set up the database
   - Configure and start the application using PM2

2. **Verify the Deployment**:

   - Access the application at: `http://<your-aws-ip>:3001`
   - Use the test script to verify database functionality:
     ```bash
     cd ~/kidplay-arcade
     node backend/test-db-auth.js
     ```

### Database Location and Backup

The SQLite database is stored at: 
```
~/kidplay-arcade/backend/kidplay_arcade.db
```

**Backup Procedure**:
1. SSH into your server
2. Copy the database file:
   ```bash
   scp -i path/to/your.pem ec2-user@<your-aws-ip>:~/kidplay-arcade/backend/kidplay_arcade.db ./backup-$(date +%Y%m%d).db
   ```

## Architecture Changes

The database integration involves the following key files:

- `server-with-db-auth.js`: Main server entry point with database integration
- `services/DatabaseService.js`: Database access service
- `user-auth-routes.js`: Authentication endpoints with database support

## Monitoring and Maintenance

The application is managed by PM2, which provides process monitoring and automatic restarts.

**Useful PM2 Commands**:
- View running processes: `pm2 list`
- View logs: `pm2 logs kidplay-arcade`
- Restart application: `pm2 restart kidplay-arcade`
- Stop application: `pm2 stop kidplay-arcade`

## Troubleshooting

1. **Database Connection Issues**:
   - Check file permissions: `ls -la ~/kidplay-arcade/backend/kidplay_arcade.db`
   - Ensure SQLite is installed: `sqlite3 --version`

2. **Server Not Starting**:
   - Check logs: `pm2 logs kidplay-arcade`
   - Verify Node.js version: `node --version`

3. **Authentication Failures**:
   - Test database integration: `node backend/test-db-auth.js`
   - Check database contents: `sqlite3 ~/kidplay-arcade/backend/kidplay_arcade.db "SELECT * FROM users LIMIT 5;"`

## Rollback Procedure

If you need to revert to the previous in-memory authentication:

1. SSH into your AWS server
2. Run:
   ```bash
   cd ~/kidplay-arcade
   pm2 stop kidplay-arcade
   pm2 delete kidplay-arcade
   sed -i 's/server-with-db-auth.js/server.js/g' ecosystem.config.js
   sed -i 's/instances: 1/instances: "max"/g' ecosystem.config.js
   sed -i 's/exec_mode: "fork"/exec_mode: "cluster"/g' ecosystem.config.js
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```
