#!/bin/bash

# ============================================
# 🚀 تشغيل بوت التداول الورقي
# Paper Trading Bot Startup Script
# ============================================

echo ""
echo "🚀 ======================================== 🚀"
echo "   بوت التداول الورقي - Paper Trading Bot"
echo "🚀 ======================================== 🚀"
echo ""

# Navigate to bot directory
cd /home/z/my-project

echo "📁 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    bun install
fi

echo ""
echo "📊 Checking database..."
bunx prisma db push --skip-generate

echo ""
echo "🔑 Generating webhook secret..."
SECRET=$(openssl rand -hex 16)
echo "   Your Webhook Secret: $SECRET"
echo "   ⚠️ Save this secret for TradingView!"

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Open IB Gateway:"
echo "   - Login with your Paper Trading account"
echo "   - Go to: Configure → Settings → API → Settings"
echo "   - Enable: ☑️ ActiveX and Socket Clients"
echo "   - Set Port: 7497 (Paper Trading)"
echo ""
echo "2️⃣  Start the bot:"
echo "   cd /home/z/my-project && bun run dev"
echo ""
echo "3️⃣  Open in browser:"
echo "   http://localhost:3000"
echo ""
echo "4️⃣  For TradingView webhooks, use ngrok:"
echo "   ngrok http 3000"
echo "   Then use the ngrok URL in TradingView"
echo ""
echo "📖 Full guide: PAPER_TRADING_SETUP.md"
echo ""
