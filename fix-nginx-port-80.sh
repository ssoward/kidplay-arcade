#!/bin/bash

# Fix nginx configuration to serve KidPlay Arcade on port 80
# Run this script on the EC2 instance

echo "🔧 Fixing nginx configuration for port 80..."

# Make sure nginx is installed
sudo yum install -y nginx

# Create proper nginx configuration
sudo tee /etc/nginx/nginx.conf > /dev/null << 'NGINXEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;

    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /home/ec2-user/kidplay-arcade/build;
        index        index.html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        # Serve static files from React build
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to Node.js backend
        location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        error_page   404              /404.html;
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
NGINXEOF

# Make sure the build directory has proper permissions
sudo chown -R nginx:nginx /home/ec2-user/kidplay-arcade/build
sudo chmod -R 755 /home/ec2-user/kidplay-arcade/build

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx --no-pager

# Check if port 80 is now listening
sudo netstat -tlnp | grep :80

echo "✅ Nginx should now be serving the application on port 80"
echo "🌐 Visit: http://3.145.53.146"
