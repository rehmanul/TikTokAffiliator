#!/bin/bash

# Production Deployment Script for TikTok Affiliator Bot

echo "Starting production deployment..."

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
  echo "Please run with sudo"
  exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p dist
mkdir -p sessions

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER .
chmod 755 logs
chmod 600 .env.production

# Install Node.js dependencies
echo "Installing dependencies..."
npm install --production

# Build the application
echo "Building application..."
npm run build

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Setup environment
echo "Setting up environment..."
cp .env.production .env

# Setup systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/tiktok-affiliator.service << EOL
[Unit]
Description=TikTok Affiliator Bot
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which pm2) start dist/index.js --name tiktok-affiliator
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd
systemctl daemon-reload

# Start the service
echo "Starting service..."
systemctl enable tiktok-affiliator
systemctl start tiktok-affiliator

# Setup log rotation
echo "Setting up log rotation..."
cat > /etc/logrotate.d/tiktok-affiliator << EOL
/var/log/tiktok-affiliator/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 $SUDO_USER $SUDO_USER
}
EOL

# Setup monitoring
echo "Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Final checks
echo "Performing final checks..."
systemctl status tiktok-affiliator
pm2 list
pm2 logs tiktok-affiliator --lines 10

echo "Deployment complete!"
echo "Monitor the application with: pm2 monit"
echo "View logs with: pm2 logs tiktok-affiliator"
