#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 Trading Bot Pro - AWS EC2 Quick Setup
# ═══════════════════════════════════════════════════════════════════════════════
# Run this on your AWS EC2 Ubuntu instance (t2.micro / t3.micro Free Tier)
# 
# After connecting via SSH, run:
# wget https://raw.githubusercontent.com/vip2551/trading-bot-pro/main/public/setup-aws.sh
# chmod +x setup-aws.sh
# ./setup-aws.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🚀 Trading Bot Pro - AWS EC2 Setup"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Ubuntu
if [ ! -f /etc/lsb-release ]; then
    echo "❌ This script is for Ubuntu only"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: System Update
# ═══════════════════════════════════════════════════════════════════════════════
echo "📦 Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install Dependencies
# ═══════════════════════════════════════════════════════════════════════════════
echo "📦 Step 2: Installing dependencies..."
sudo apt install -y curl wget git unzip xvfb openjdk-17-jre-headless

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Install Bun
# ═══════════════════════════════════════════════════════════════════════════════
echo "📦 Step 3: Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
fi
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Install IB Gateway (Optional - for real trading)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 4: IB Gateway Setup"
read -p "Do you want to install IB Gateway for real trading? (y/n): " INSTALL_IB

if [ "$INSTALL_IB" = "y" ] || [ "$INSTALL_IB" = "Y" ]; then
    echo "Installing IB Gateway..."
    sudo mkdir -p /opt/ibgateway
    cd /opt/ibgateway
    
    if [ ! -f "ibgateway-stable-standalone-linux-x64.sh" ]; then
        sudo wget -q https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
        sudo chmod +x ibgateway-stable-standalone-linux-x64.sh
    fi
    
    if [ ! -f "/opt/ibgateway/ibgateway" ]; then
        sudo ./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway
    fi
    
    # Get IB credentials
    read -p "Enter your IB Username: " IB_USER
    read -p "Enter your IB Password: " IB_PASS
    read -p "Trading Mode (paper/live) [paper]: " IB_MODE
    IB_MODE=${IB_MODE:-paper}
    
    mkdir -p ~/IBGateway
    cat > ~/IBGateway/jts.ini << EOF
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
    
    # Create IB Gateway service
    sudo tee /etc/systemd/system/ibgateway.service > /dev/null << 'EOF'
[Unit]
Description=IB Gateway
After=network.target

[Service]
Type=simple
User=ubuntu
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24
ExecStart=/opt/ibgateway/ibgateway
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    echo "✅ IB Gateway installed"
else
    echo "⏭️ Skipping IB Gateway (Simulation mode)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Clone Trading Bot
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 5: Cloning Trading Bot..."
mkdir -p ~/trading-bot
cd ~/trading-bot

if [ ! -d ".git" ]; then
    git clone https://github.com/vip2551/trading-bot-pro.git .
fi

# Install dependencies
export PATH="$HOME/.bun/bin:$PATH"
~/.bun/bin/bun install

# Setup database
~/.bun/bin/bun run db:push

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Create Trading Bot Service
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🔧 Step 6: Creating trading bot service..."

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "YOUR_IP")

# Set default to simulation mode
~/.bun/bin/bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  await db.botSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      userId: 'demo',
      accountType: 'simulation',
      isRunning: false,
      ibConnected: false,
      telegramEnabled: false,
      defaultQuantity: 1,
      maxRiskPerTrade: 100,
      strikeSelectionMode: 'AUTO',
      contractPriceMin: 300,
      contractPriceMax: 400
    },
    update: { accountType: 'simulation' }
  });
}
main();
"

# Create trading bot service
sudo tee /etc/systemd/system/trading-bot.service > /dev/null << EOF
[Unit]
Description=Trading Bot Pro
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/trading-bot
Environment="PATH=/home/ubuntu/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/ubuntu/.bun/bin/bun run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7: Enable and Start Services
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "🚀 Step 7: Starting services..."

sudo systemctl daemon-reload
sudo systemctl enable trading-bot

if [ "$INSTALL_IB" = "y" ] || [ "$INSTALL_IB" = "Y" ]; then
    sudo systemctl enable ibgateway
    sudo systemctl start ibgateway
    sleep 5
fi

sudo systemctl start trading-bot

# ═══════════════════════════════════════════════════════════════════════════════
# DONE!
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "✅ Installation Complete!"
echo "══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Access your bot at: http://$PUBLIC_IP:3000"
echo ""
echo "📋 AWS Security Group Settings Needed:"
echo "   - Open port 3000 (HTTP)"
echo "   - Open port 7497 (IB Gateway Paper) if using IB"
echo ""
echo "📋 Useful Commands:"
echo "   Check bot status:    sudo systemctl status trading-bot"
echo "   View bot logs:       sudo journalctl -u trading-bot -f"
echo "   Restart bot:         sudo systemctl restart trading-bot"
echo ""
echo "══════════════════════════════════════════════════════════════════════════"
