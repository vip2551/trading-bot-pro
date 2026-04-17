import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Creating database tables...');
    const results: string[] = [];

    // User table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "email" TEXT UNIQUE,
          "name" TEXT,
          "password" TEXT,
          "image" TEXT,
          "isAdmin" BOOLEAN DEFAULT false,
          "emailVerified" BOOLEAN DEFAULT false,
          "emailVerifiedAt" TIMESTAMP,
          "verificationToken" TEXT,
          "verificationExpires" TIMESTAMP,
          "resetToken" TEXT,
          "resetExpires" TIMESTAMP,
          "twoFactorEnabled" BOOLEAN DEFAULT false,
          "twoFactorSecret" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('User ✓');
    } catch (e: any) {
      results.push(`User: ${e.message}`);
    }

    // Plan table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Plan" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" TEXT UNIQUE,
          "displayName" TEXT,
          "displayNameEn" TEXT,
          "description" TEXT,
          "priceMonthly" FLOAT DEFAULT 0,
          "priceYearly" FLOAT DEFAULT 0,
          "currency" TEXT DEFAULT 'USD',
          "originalPriceMonthly" FLOAT,
          "originalPriceYearly" FLOAT,
          "discountPercent" FLOAT,
          "discountEnabled" BOOLEAN DEFAULT false,
          "discountExpiresAt" TIMESTAMP,
          "discountLabel" TEXT,
          "maxTradesPerDay" INTEGER DEFAULT 5,
          "maxActiveTrades" INTEGER DEFAULT 2,
          "trialDays" INTEGER DEFAULT 0,
          "features" TEXT,
          "featuresAr" TEXT,
          "hasAIAnalysis" BOOLEAN DEFAULT false,
          "hasWhaleTracker" BOOLEAN DEFAULT false,
          "hasAdvancedCharts" BOOLEAN DEFAULT false,
          "hasPaperTrading" BOOLEAN DEFAULT false,
          "hasBacktesting" BOOLEAN DEFAULT false,
          "hasTelegramNotif" BOOLEAN DEFAULT true,
          "hasPrioritySupport" BOOLEAN DEFAULT false,
          "hasAPIAccess" BOOLEAN DEFAULT false,
          "isPopular" BOOLEAN DEFAULT false,
          "isActive" BOOLEAN DEFAULT true,
          "sortOrder" INTEGER DEFAULT 0,
          "badgeText" TEXT,
          "badgeColor" TEXT,
          "stripePriceIdMonthly" TEXT,
          "stripePriceIdYearly" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('Plan ✓');
    } catch (e: any) {
      results.push(`Plan: ${e.message}`);
    }

    // Subscription table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Subscription" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT UNIQUE,
          "planId" TEXT,
          "planName" TEXT DEFAULT 'TRIAL',
          "status" TEXT DEFAULT 'ACTIVE',
          "isTrial" BOOLEAN DEFAULT false,
          "trialEndsAt" TIMESTAMP,
          "currentPeriodStart" TIMESTAMP,
          "currentPeriodEnd" TIMESTAMP,
          "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
          "stripeCustomerId" TEXT,
          "stripeSubscriptionId" TEXT,
          "maxTradesPerDay" INTEGER DEFAULT 5,
          "maxActiveTrades" INTEGER DEFAULT 2,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('Subscription ✓');
    } catch (e: any) {
      results.push(`Subscription: ${e.message}`);
    }

    // BotSettings table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BotSettings" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT UNIQUE,
          "isRunning" BOOLEAN DEFAULT false,
          "accountType" TEXT DEFAULT 'PAPER',
          "ibHost" TEXT DEFAULT '127.0.0.1',
          "ibPort" INTEGER DEFAULT 7497,
          "ibClientId" INTEGER DEFAULT 1,
          "ibConnected" BOOLEAN DEFAULT false,
          "defaultQuantity" INTEGER DEFAULT 1,
          "maxRiskPerTrade" FLOAT DEFAULT 100,
          "defaultExpiry" TEXT DEFAULT '0DTE',
          "positionSizeMode" TEXT DEFAULT 'FIXED',
          "positionSizePercent" FLOAT DEFAULT 5,
          "positionSizeAmount" FLOAT DEFAULT 500,
          "spxStrikeOffset" INTEGER DEFAULT 5,
          "spxDeltaTarget" FLOAT DEFAULT 0.3,
          "strikeSelectionMode" TEXT DEFAULT 'CONTRACT_PRICE',
          "contractPriceMin" FLOAT DEFAULT 300,
          "contractPriceMax" FLOAT DEFAULT 400,
          "maxSpreadPercent" FLOAT DEFAULT 5,
          "minLiquidity" INTEGER DEFAULT 100,
          "checkLiquidity" BOOLEAN DEFAULT true,
          "checkSpread" BOOLEAN DEFAULT true,
          "maxSlippagePercent" FLOAT DEFAULT 1,
          "orderType" TEXT DEFAULT 'LIMIT',
          "limitOrderOffset" FLOAT DEFAULT 0.5,
          "timeoutSeconds" INTEGER DEFAULT 30,
          "retryAttempts" INTEGER DEFAULT 3,
          "allowMultipleTrades" BOOLEAN DEFAULT false,
          "maxOpenPositions" INTEGER DEFAULT 1,
          "smartModeEnabled" BOOLEAN DEFAULT false,
          "maxDailyLoss" FLOAT DEFAULT 500,
          "avoidLowLiquidityHours" BOOLEAN DEFAULT true,
          "avoidNewsEvents" BOOLEAN DEFAULT false,
          "defaultStopLoss" FLOAT,
          "defaultTakeProfit" FLOAT,
          "trailingStopDefault" FLOAT,
          "accountBalance" FLOAT,
          "availableFunds" FLOAT,
          "buyingPower" FLOAT,
          "telegramBotToken" TEXT,
          "telegramChatId" TEXT,
          "telegramEnabled" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('BotSettings ✓');
    } catch (e: any) {
      results.push(`BotSettings: ${e.message}`);
    }

    // NotificationSettings table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "NotificationSettings" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT UNIQUE,
          "telegramEnabled" BOOLEAN DEFAULT false,
          "telegramBotToken" TEXT,
          "telegramChatId" TEXT,
          "discordEnabled" BOOLEAN DEFAULT false,
          "discordWebhookUrl" TEXT,
          "emailEnabled" BOOLEAN DEFAULT false,
          "emailOnTradeOpen" BOOLEAN DEFAULT true,
          "emailOnTradeClose" BOOLEAN DEFAULT true,
          "emailOnDailyReport" BOOLEAN DEFAULT false,
          "pushEnabled" BOOLEAN DEFAULT false,
          "pushOnTradeOpen" BOOLEAN DEFAULT true,
          "pushOnTradeClose" BOOLEAN DEFAULT true,
          "pushOnPriceAlert" BOOLEAN DEFAULT false,
          "notifyOnNewSignal" BOOLEAN DEFAULT true,
          "notifyOnError" BOOLEAN DEFAULT true,
          "quietHoursEnabled" BOOLEAN DEFAULT false,
          "quietHoursStart" TEXT,
          "quietHoursEnd" TEXT,
          "notificationLanguage" TEXT DEFAULT 'en',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('NotificationSettings ✓');
    } catch (e: any) {
      results.push(`NotificationSettings: ${e.message}`);
    }

    // Trade table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Trade" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT,
          "symbol" TEXT,
          "instrumentType" TEXT,
          "direction" TEXT,
          "quantity" INTEGER,
          "filledQuantity" INTEGER DEFAULT 0,
          "entryPrice" FLOAT,
          "exitPrice" FLOAT,
          "strike" FLOAT,
          "expiry" TEXT,
          "optionType" TEXT,
          "delta" FLOAT,
          "gamma" FLOAT,
          "theta" FLOAT,
          "vega" FLOAT,
          "impliedVolatility" FLOAT,
          "status" TEXT DEFAULT 'PENDING',
          "ibOrderId" INTEGER,
          "pnl" FLOAT,
          "pnlPercent" FLOAT,
          "maxDrawdown" FLOAT,
          "maxProfit" FLOAT,
          "stopLoss" FLOAT,
          "takeProfit" FLOAT,
          "trailingStopEnabled" BOOLEAN DEFAULT false,
          "trailingStopAmount" FLOAT,
          "trailingStopPercent" FLOAT,
          "trailingStopPrice" FLOAT,
          "trailingStopActivated" BOOLEAN DEFAULT false,
          "isBracketOrder" BOOLEAN DEFAULT false,
          "bracketStopOrderId" INTEGER,
          "bracketProfitOrderId" INTEGER,
          "maxHoldingMinutes" INTEGER,
          "autoCloseAt" TIMESTAMP,
          "signalSource" TEXT,
          "signalStrategy" TEXT,
          "signalTime" TIMESTAMP,
          "bidPrice" FLOAT,
          "askPrice" FLOAT,
          "spreadPercent" FLOAT,
          "volumeAtExecution" INTEGER,
          "slippage" FLOAT,
          "tags" TEXT,
          "openedAt" TIMESTAMP,
          "closedAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('Trade ✓');
    } catch (e: any) {
      results.push(`Trade: ${e.message}`);
    }

    // TradingViewSignal table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TradingViewSignal" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT,
          "symbol" TEXT,
          "action" TEXT,
          "strategy" TEXT,
          "price" FLOAT,
          "strike" FLOAT,
          "expiry" TEXT,
          "quantity" INTEGER,
          "stopLoss" FLOAT,
          "takeProfit" FLOAT,
          "processed" BOOLEAN DEFAULT false,
          "processedAt" TIMESTAMP,
          "tradeId" TEXT,
          "rawPayload" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('TradingViewSignal ✓');
    } catch (e: any) {
      results.push(`TradingViewSignal: ${e.message}`);
    }

    // SignalLog table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SignalLog" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "source" TEXT DEFAULT 'TRADINGVIEW',
          "webhookId" TEXT,
          "symbol" TEXT,
          "action" TEXT,
          "direction" TEXT,
          "price" FLOAT,
          "entryPrice" FLOAT,
          "currentPrice" FLOAT,
          "strike" FLOAT,
          "expiry" TEXT,
          "optionType" TEXT,
          "quantity" INTEGER,
          "positionSize" FLOAT,
          "stopLoss" FLOAT,
          "takeProfit" FLOAT,
          "trailingStop" FLOAT,
          "strategy" TEXT,
          "strategyName" TEXT,
          "timeframe" TEXT,
          "confidence" FLOAT,
          "status" TEXT DEFAULT 'RECEIVED',
          "executed" BOOLEAN DEFAULT false,
          "executedAt" TIMESTAMP,
          "tradeId" TEXT,
          "errorMessage" TEXT,
          "errorCode" TEXT,
          "responseStatus" INTEGER,
          "responseMessage" TEXT,
          "rawPayload" TEXT,
          "headers" TEXT,
          "sourceIp" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('SignalLog ✓');
    } catch (e: any) {
      results.push(`SignalLog: ${e.message}`);
    }

    // WebhookSecret table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WebhookSecret" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT,
          "secret" TEXT UNIQUE,
          "name" TEXT,
          "permissions" TEXT DEFAULT '[]',
          "active" BOOLEAN DEFAULT true,
          "lastUsedAt" TIMESTAMP,
          "useCount" INTEGER DEFAULT 0,
          "ipWhitelist" TEXT,
          "rateLimit" INTEGER DEFAULT 60,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('WebhookSecret ✓');
    } catch (e: any) {
      results.push(`WebhookSecret: ${e.message}`);
    }

    // Payment table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Payment" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT,
          "amount" FLOAT,
          "currency" TEXT DEFAULT 'USD',
          "status" TEXT DEFAULT 'PENDING',
          "stripePaymentIntentId" TEXT,
          "stripeInvoiceId" TEXT,
          "planName" TEXT,
          "billingPeriod" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('Payment ✓');
    } catch (e: any) {
      results.push(`Payment: ${e.message}`);
    }

    // PaperTradingAccount table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PaperTradingAccount" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT UNIQUE,
          "balance" FLOAT DEFAULT 100000,
          "availableFunds" FLOAT DEFAULT 100000,
          "initialBalance" FLOAT DEFAULT 100000,
          "dailyPnL" FLOAT DEFAULT 0,
          "totalTrades" INTEGER DEFAULT 0,
          "winningTrades" INTEGER DEFAULT 0,
          "losingTrades" INTEGER DEFAULT 0,
          "leverage" FLOAT DEFAULT 1,
          "commission" FLOAT DEFAULT 0.65,
          "slippage" FLOAT DEFAULT 0.1,
          "maxPositionSize" FLOAT DEFAULT 10,
          "maxDailyLoss" FLOAT DEFAULT 5,
          "riskPerTrade" FLOAT DEFAULT 2,
          "lastResetAt" TIMESTAMP DEFAULT NOW(),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('PaperTradingAccount ✓');
    } catch (e: any) {
      results.push(`PaperTradingAccount: ${e.message}`);
    }

    // PaperTrade table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PaperTrade" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "accountId" TEXT,
          "symbol" TEXT,
          "direction" TEXT,
          "quantity" INTEGER,
          "entryPrice" FLOAT,
          "exitPrice" FLOAT,
          "currentPrice" FLOAT DEFAULT 0,
          "stopLoss" FLOAT,
          "takeProfit" FLOAT,
          "trailingStopPercent" FLOAT,
          "trailingStopPrice" FLOAT,
          "highestPrice" FLOAT DEFAULT 0,
          "lowestPrice" FLOAT DEFAULT 0,
          "pnl" FLOAT DEFAULT 0,
          "pnlPercent" FLOAT DEFAULT 0,
          "status" TEXT DEFAULT 'OPEN',
          "closeReason" TEXT,
          "openedAt" TIMESTAMP DEFAULT NOW(),
          "closedAt" TIMESTAMP,
          "expiresAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push('PaperTrade ✓');
    } catch (e: any) {
      results.push(`PaperTrade: ${e.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed',
      results
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    return NextResponse.json({ 
      success: true,
      tables,
      databaseUrl: process.env.DATABASE_URL ? 'متصل' : 'غير متصل'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'متصل' : 'غير متصل'
    }, { status: 500 });
  }
}
