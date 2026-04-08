#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 Trading Bot Pro - VPS Quick Setup Script
# ═══════════════════════════════════════════════════════════════════════════════
# Run this script on a fresh Ubuntu 22.04/24.04 VPS
# Usage: curl -fsSL https://your-domain.com/setup-vps.sh | bash
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🚀 Trading Bot Pro - VPS Setup"
echo "═══════════════════════════════════════════════════════"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: System Update
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 1: Updating system..."
apt update && apt upgrade -y

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install Dependencies
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 2: Installing dependencies..."
apt install -y curl wget unzip xvfb openjdk-17-jre-headless git nginx

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Install Bun
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 3: Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Install IB Gateway
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 4: Installing IB Gateway..."
mkdir -p /opt/ibgateway
cd /opt/ibgateway

if [ ! -f "ibgateway-stable-standalone-linux-x64.sh" ]; then
    wget -q https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
    chmod +x ibgateway-stable-standalone-linux-x64.sh
fi

if [ ! -f "/opt/ibgateway/ibgateway" ]; then
    ./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway
fi

mkdir -p /root/IBGateway

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Create IB Gateway Config
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📝 Step 5: Creating IB Gateway config..."

read -p "Enter your IB Username: " IB_USER
read -p "Enter your IB Password: " IB_PASS
read -p "Trading Mode (paper/live) [paper]: " IB_MODE
IB_MODE=${IB_MODE:-paper}

IB_PORT=7497
if [ "$IB_MODE" = "live" ]; then
    IB_PORT=7496
fi

cat > /root/IBGateway/jts.ini << EOF
[Logon]
user=$IB_USER
password=$IB_PASS
TradingMode=$IB_MODE
locale=en
minimize=true

[MainWindow]
x=0
y=0
width=400
height=200
EOF

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Clone Trading Bot
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 6: Cloning Trading Bot..."
mkdir -p /root/trading-bot
cd /root/trading-bot

if [ ! -d ".git" ]; then
    git clone https://github.com/vip2551/trading-bot-pro.git .
fi

# Install dependencies
export PATH="$HOME/.bun/bin:$PATH"
bun install

# Setup database
bun run db:push

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7: Create Systemd Services
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔧 Step 7: Creating systemd services..."

# IB Gateway Service
cat > /etc/systemd/system/ibgateway.service << 'EOF'
[Unit]
Description=IB Gateway
After=network.target

[Service]
Type=simple
User=root
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24
ExecStart=/opt/ibgateway/ibgateway
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

# Trading Bot Service
cat > /etc/systemd/system/trading-bot.service << EOF
[Unit]
Description=Trading Bot Pro
After=network.target ibgateway.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/trading-bot
Environment="PATH=/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/root/.bun/bin/bun run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable services
systemctl daemon-reload
systemctl enable ibgateway
systemctl enable trading-bot

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8: Configure Nginx
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🌐 Step 8: Configuring Nginx..."

SERVER_IP=$(curl -s ifconfig.me)

cat > /etc/nginx/sites-available/trading-bot << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/trading-bot /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9: Configure Firewall
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔒 Step 9: Configuring firewall..."
apt install -y ufw
ufw --force reset
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow $IB_PORT/tcp
ufw --force enable

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10: Start Services
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🚀 Step 10: Starting services..."
systemctl start ibgateway
sleep 5
systemctl start trading-bot

# ═══════════════════════════════════════════════════════════════════════════════
# DONE!
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "✅ Installation Complete!"
echo "══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Access your bot at: http://$SERVER_IP"
echo ""
echo "📋 Useful Commands:"
echo "   Check bot status:    systemctl status trading-bot"
echo "   Check IB status:     systemctl status ibgateway"
echo "   View bot logs:       journalctl -u trading-bot -f"
echo "   View IB logs:        journalctl -u ibgateway -f"
echo "   Restart bot:         systemctl restart trading-bot"
echo "   Restart IB:          systemctl restart ibgateway"
echo ""
echo "══════════════════════════════════════════════════════════════════════════"
