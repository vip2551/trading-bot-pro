#!/bin/bash

echo "🚀 ======================================== 🚀"
echo "   تهيئة التداول الورقي - Paper Trading Setup"
echo "🚀 ======================================== 🚀"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the bot directory${NC}"
    echo "   cd /home/z/my-project"
    exit 1
fi

echo -e "${BLUE}📁 Step 1: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    bun install
else
    echo -e "${GREEN}   ✓ Dependencies installed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Step 2: Initializing database...${NC}"
bunx prisma db push
echo -e "${GREEN}   ✓ Database ready${NC}"

echo ""
echo -e "${BLUE}🔑 Step 3: Checking webhook secret...${NC}"
SECRET_COUNT=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM WebhookSecret" 2>/dev/null || echo "0")
if [ "$SECRET_COUNT" = "0" ]; then
    echo "   Generating new webhook secret..."
    NEW_SECRET=$(openssl rand -hex 16)
    sqlite3 prisma/dev.db "INSERT INTO WebhookSecret (id, secret, name, active, createdAt, updatedAt) VALUES ('$(openssl rand -hex 8)', '$NEW_SECRET', 'TradingView Webhook', 1, datetime('now'), datetime('now'))"
    echo -e "${GREEN}   ✓ New secret generated: $NEW_SECRET${NC}"
    echo ""
    echo -e "${YELLOW}   ⚠️  Save this secret - you'll need it for TradingView!${NC}"
else
    EXISTING_SECRET=$(sqlite3 prisma/dev.db "SELECT secret FROM WebhookSecret LIMIT 1")
    echo -e "${GREEN}   ✓ Existing secret: $EXISTING_SECRET${NC}"
fi

echo ""
echo -e "${BLUE}🤖 Step 4: Checking Telegram settings...${NC}"
TELEGRAM_ENABLED=$(sqlite3 prisma/dev.db "SELECT telegramEnabled FROM BotSettings LIMIT 1" 2>/dev/null || echo "0")
if [ "$TELEGRAM_ENABLED" = "1" ]; then
    echo -e "${GREEN}   ✓ Telegram is configured${NC}"
else
    echo -e "${YELLOW}   ⚠️  Telegram not configured${NC}"
    echo "   You can configure it later in the Settings page"
fi

echo ""
echo -e "${BLUE}🔌 Step 5: Checking IB Gateway connection...${NC}"
IB_CHECK=$(curl -s http://localhost:3003/health 2>/dev/null || echo '{"status":"offline"}')
if echo "$IB_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}   ✓ IB Gateway is connected${NC}"
else
    echo -e "${YELLOW}   ⚠️  IB Gateway not connected${NC}"
    echo "   Make sure IB Gateway is running on port 7497"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "   1. Start IB Gateway and login with paper trading account"
echo "   2. Enable API in IB Gateway (Configure → Settings → API)"
echo "   3. Run: bun run dev"
echo "   4. Open: http://localhost:3000"
echo "   5. Configure Telegram in Settings (optional)"
echo "   6. Set up ngrok for TradingView webhooks:"
echo "      ngrok http 3000"
echo ""
echo "📖 Full guide: PAPER_TRADING_SETUP.md"
echo ""
