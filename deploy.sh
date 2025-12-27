#!/bin/bash
# Deployment script for NodeHub API

set -e

echo "NodeHub API Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Create user if not exists
if ! id -u nodehub > /dev/null 2>&1; then
    echo "Creating nodehub user..."
    useradd -r -s /bin/false -d /opt/nodehub-api nodehub
fi

# Create directories
echo "Creating directories..."
mkdir -p /opt/nodehub-api
mkdir -p /opt/nodehub-api/config
mkdir -p /opt/nodehub-api/templates
mkdir -p /opt/nodehub-api/data
mkdir -p /var/log/nodehub-api

# Copy files
echo "Copying files..."
cp -r . /opt/nodehub-api/
chown -R nodehub:nodehub /opt/nodehub-api

# Install dependencies
echo "Installing dependencies..."
cd /opt/nodehub-api
su - nodehub -s /bin/bash -c "cd /opt/nodehub-api && bun install"

# Setup environment file
if [ ! -f /opt/nodehub-api/config/.env ]; then
    echo "Creating .env file..."
    cp config/.env.example /opt/nodehub-api/config/.env
    echo -e "${YELLOW}Please edit /opt/nodehub-api/config/.env with your configuration${NC}"
fi

# Install systemd service
echo "Installing systemd service..."
cp nodehub-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable nodehub-api

echo ""
echo -e "${GREEN}Deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit configuration: /opt/nodehub-api/config/.env"
echo "2. Start service: systemctl start nodehub-api"
echo "3. Check status: systemctl status nodehub-api"
echo "4. View logs: journalctl -u nodehub-api -f"
