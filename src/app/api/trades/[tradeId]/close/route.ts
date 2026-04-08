import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { telegramService } from '@/lib/telegram-service';

// Calculate P&L for options
function calculatePnL(trade: any, exitPrice: number): number {
  const entryPrice = trade.entryPrice || 0;
  const qty = trade.quantity || 1;
  const multiplier = 100; // SPX option multiplier

  if (trade.optionType === 'PUT' || trade.direction === 'PUT' || trade.direction === 'SELL') {
    return (entryPrice - exitPrice) * qty * multiplier;
  }
  return (exitPrice - entryPrice) * qty * multiplier;
}

// Get current price (simulated or from IB)
async function getCurrentPrice(trade: any): Promise<number> {
  // Try to get real price from IB service
  try {
    const res = await fetch('http://localhost:3003/market/spx');
    if (res.ok) {
      const data = await res.json();
      if (data.price) {
        // Estimate option price based on spot movement
        const spotChange = data.price - 5800;
        const optionDelta = trade.optionType === 'CALL' ? 0.5 : -0.5;
        const baseOptionPrice = trade.entryPrice || 350;
        return Math.max(1, baseOptionPrice + (spotChange * optionDelta * 0.1));
      }
    }
  } catch {
    // IB service not available
  }

  // Try trade monitor service for cached price
  try {
    const res = await fetch('http://localhost:3004/prices');
    if (res.ok) {
      const data = await res.json();
      if (data.prices[trade.id]) {
        return data.prices[trade.id].price;
      }
    }
  } catch {
    // Monitor not available
  }

  // Simulate price for demo
  const basePrice = trade.entryPrice || 350;
  const randomChange = (Math.random() - 0.5) * 30;
  return Math.max(1, basePrice + randomChange);
}

// POST - Close a trade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;
    
    // Get the trade
    const trade = await db.trade.findUnique({
      where: { id: tradeId },
    });
    
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    
    if (trade.status !== 'OPEN' && trade.status !== 'PENDING') {
      return NextResponse.json({ error: 'Trade is not open' }, { status: 400 });
    }

    // Get current price and calculate P&L
    const exitPrice = await getCurrentPrice(trade);
    const pnl = calculatePnL(trade, exitPrice);
    
    // Update trade status
    const updatedTrade = await db.trade.update({
      where: { id: tradeId },
      data: {
        status: 'CLOSED',
        exitPrice: exitPrice,
        pnl: pnl,
        closedAt: new Date(),
      },
    });
    
    // Log the action
    await db.tradeLog.create({
      data: {
        tradeId,
        action: 'CLOSED',
        details: `Trade closed manually at $${exitPrice.toFixed(2)}, P&L: $${pnl.toFixed(2)}`,
      },
    });

    // Send Telegram notification with Arabic
    const settings = await db.botSettings.findFirst();
    if (settings?.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      try {
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

        // Send detailed close notification
        await telegramService.sendTradeClosedNotification({
          symbol: trade.symbol,
          direction: trade.optionType as 'CALL' | 'PUT' || trade.direction as 'CALL' | 'PUT',
          strike: trade.strike || 0,
          contracts: trade.quantity,
          entryPrice: trade.entryPrice || 0,
          exitPrice: exitPrice,
          pnl: pnl,
          openTime: trade.createdAt,
          closeTime: new Date(),
        });
        
        console.log('📱 Telegram close notification sent');
      } catch (telegramError) {
        console.error('❌ Telegram error:', telegramError);
      }
    }
    
    // Send to IB service to close
    if (settings?.isRunning) {
      try {
        await fetch(`http://localhost:3003/trade/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tradeId, exitPrice }),
        });
      } catch (err) {
        console.error('Failed to send close request to IB service:', err);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      trade: updatedTrade,
      exitPrice,
      pnl
    });
  } catch (error) {
    console.error('Error closing trade:', error);
    return NextResponse.json({ error: 'Failed to close trade' }, { status: 500 });
  }
}
