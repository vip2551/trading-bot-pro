import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { telegramService } from '@/lib/telegram-service';
import { BotSettings } from '@prisma/client';

// Helper to ensure user exists
async function ensureUserExists(userId: string) {
  try {
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.create({
        data: { 
          id: userId, 
          email: `${userId}@demo.local`, 
          name: userId 
        },
      });
    }
    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return null;
  }
}

// Get current stock price
async function getStockPrice(symbol: string): Promise<number> {
  try {
    const res = await fetch(`http://localhost:3000/api/price?symbol=${symbol}`);
    if (res.ok) {
      const data = await res.json();
      return data.price || data.spotPrice || 0;
    }
  } catch {
    // Price API not available
  }
  
  // Fallback prices
  const fallbackPrices: Record<string, number> = {
    SPX: 5850.50,
    SPY: 585.25,
    QQQ: 485.75,
  };
  return fallbackPrices[symbol] || 100;
}

// Get option price
async function getOptionPrice(symbol: string, strike: number, optionType: string): Promise<number> {
  try {
    const res = await fetch(`http://localhost:3000/api/price?symbol=${symbol}&strike=${strike}&optionType=${optionType}`);
    if (res.ok) {
      const data = await res.json();
      return data.optionPrice || 0;
    }
  } catch {
    // Price API not available
  }
  
  // Fallback: estimate based on strike
  const basePrice = 350;
  return basePrice + (Math.random() - 0.5) * 50;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Manual trade request:', JSON.stringify(body, null, 2));
    
    const {
      userId,
      symbol,
      direction,
      quantity,
      strike,
      instrumentType,
      optionType,
      expiry,
      stopLoss,
      takeProfit,
      trailingStopEnabled,
      trailingStopAmount,
      trailingStopPercent,
      isBracketOrder,
      maxHoldingMinutes,
    } = body;

    // Validate required fields
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }
    if (!direction) {
      return NextResponse.json({ error: 'Direction is required' }, { status: 400 });
    }

    // Demo mode - skip subscription check for demo user
    const isDemoMode = !userId || userId === 'demo' || userId === 'undefined' || userId === 'null';
    const effectiveUserId = isDemoMode ? 'demo' : userId;
    
    console.log(`👤 User ID: ${effectiveUserId} (Demo mode: ${isDemoMode})`);

    // Ensure user exists
    if (effectiveUserId) {
      await ensureUserExists(effectiveUserId);
    }

    // Get settings
    let settings: BotSettings | null = null;
    try {
      settings = effectiveUserId
        ? await db.botSettings.findUnique({ where: { userId: effectiveUserId } })
        : await db.botSettings.findFirst();
    } catch (e) {
      console.log('No settings found, using defaults');
    }

    // Determine instrument type
    let determinedInstrumentType = instrumentType || 'OPTION';
    if (!instrumentType) {
      if (['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'].includes(symbol)) {
        determinedInstrumentType = 'STOCK';
      } else if (['ES', 'NQ', 'YM', 'RTY', 'GC', 'SI', 'CL'].includes(symbol)) {
        determinedInstrumentType = 'FUTURE';
      } else if (symbol.includes('USD')) {
        determinedInstrumentType = 'FOREX';
      }
    }

    // Calculate auto close time
    const autoCloseAt = maxHoldingMinutes ? new Date(Date.now() + maxHoldingMinutes * 60000) : null;

    // Prepare trade data
    const tradeData = {
      userId: effectiveUserId || null,
      symbol,
      instrumentType: determinedInstrumentType,
      direction,
      quantity: quantity || settings?.defaultQuantity || 1,
      entryPrice: 0,
      strike: strike || null,
      expiry: expiry || '0DTE',
      optionType: optionType || (['CALL', 'PUT'].includes(direction) ? direction : null),
      status: 'PENDING' as const,
      signalSource: 'MANUAL',
      signalTime: new Date(),
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      trailingStopEnabled: trailingStopEnabled || false,
      trailingStopAmount: trailingStopAmount || null,
      trailingStopPercent: trailingStopPercent || null,
      isBracketOrder: isBracketOrder || false,
      maxHoldingMinutes: maxHoldingMinutes || null,
      autoCloseAt,
    };

    console.log('📊 Creating trade with data:', JSON.stringify(tradeData, null, 2));

    // Create trade
    const trade = await db.trade.create({
      data: tradeData,
    });

    console.log('✅ Trade created:', trade.id);

    // Log
    try {
      await db.tradeLog.create({
        data: {
          tradeId: trade.id,
          action: 'CREATED',
          details: 'Manual trade created from browser',
        },
      });
    } catch (e) {
      console.log('Could not create trade log (non-critical)');
    }

    // Send to IB if running
    if (settings?.isRunning) {
      try {
        await fetch('http://localhost:3003/trade/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tradeId: trade.id,
            symbol,
            direction,
            quantity: trade.quantity,
            strike: trade.strike,
            stopLoss,
            takeProfit,
          }),
        });
        console.log('📤 Sent to IB service');
      } catch {
        console.log('IB service not available');
      }
    }

    // Send Telegram notification with all details
    if (settings?.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      try {
        // Get current prices
        const stockPrice = await getStockPrice(symbol);
        const optionPrice = trade.strike 
          ? await getOptionPrice(symbol, trade.strike, trade.optionType || direction)
          : 0;
        
        // Configure telegram service
        telegramService.configure({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
          enabled: true,
          language: 'ar', // Arabic notifications
          notifications: {
            tradeExecuted: true,
            tradeClosed: true,
            orderFilled: true,
            dailyReport: true,
            weeklyReport: true,
            errorAlerts: true,
            systemAlerts: true,
            whaleActivity: true,
            priceUpdates: true
          }
        });

        // Send detailed notification
        await telegramService.sendTradeOpenedNotification({
          symbol,
          direction: trade.optionType as 'CALL' | 'PUT' || direction as 'CALL' | 'PUT',
          strike: trade.strike || 0,
          strikePrice: optionPrice,
          contracts: trade.quantity,
          stockPrice,
          entryPrice: optionPrice,
          executionTime: new Date(),
        });
        
        console.log('📱 Telegram notification sent');
      } catch (telegramError) {
        console.error('❌ Telegram error:', telegramError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      trade,
      message: 'Trade created successfully'
    });
  } catch (error) {
    console.error('❌ Error opening manual trade:', error);
    
    // Return detailed error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json({ 
      error: 'Failed to open trade', 
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}
