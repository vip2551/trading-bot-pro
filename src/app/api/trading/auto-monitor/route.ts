import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Auto Trade Monitoring System

interface TradeDecision {
  tradeId: string;
  action: 'HOLD' | 'EXIT_NOW' | 'EXIT_SOON' | 'ADJUST_STOP' | 'TAKE_PROFIT';
  reason: string;
  confidence: number;
  suggestedPrice?: number;
  currentPnL?: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface MarketCondition {
  symbol: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}

// Analyze single trade
async function analyzeTrade(trade: {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  quantity: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  trailingStopEnabled: boolean;
  trailingStopPercent?: number | null;
  maxHoldingMinutes?: number | null;
  openedAt: Date;
}): Promise<TradeDecision> {
  
  // Simulate current market data (in production, fetch real data)
  const currentPrice = trade.entryPrice * (0.95 + Math.random() * 0.10);
  const isLong = trade.direction === 'CALL' || trade.direction === 'BUY';
  
  // Calculate P&L
  const pnlPercent = isLong 
    ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100
    : ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
  
  // Calculate holding time
  const holdingMinutes = (Date.now() - new Date(trade.openedAt).getTime()) / (1000 * 60);
  
  // Generate technical signals (simplified)
  const rsi = 20 + Math.random() * 60;
  const macdBullish = Math.random() > 0.5;
  const trendStrength = Math.random() * 100;
  
  // Decision logic
  let action: TradeDecision['action'] = 'HOLD';
  let reason = 'الصفقة مستقرة';
  let urgency: TradeDecision['urgency'] = 'LOW';
  let confidence = 60;
  
  // Check stop loss
  if (trade.stopLoss) {
    const stopHit = isLong 
      ? currentPrice <= trade.stopLoss
      : currentPrice >= trade.stopLoss;
    
    if (stopHit) {
      return {
        tradeId: trade.id,
        action: 'EXIT_NOW',
        reason: `🔴 تم تفعيل وقف الخسارة عند ${trade.stopLoss}`,
        confidence: 100,
        suggestedPrice: trade.stopLoss,
        currentPnL: pnlPercent,
        urgency: 'CRITICAL'
      };
    }
  }
  
  // Check take profit
  if (trade.takeProfit) {
    const tpHit = isLong
      ? currentPrice >= trade.takeProfit
      : currentPrice <= trade.takeProfit;
    
    if (tpHit) {
      return {
        tradeId: trade.id,
        action: 'TAKE_PROFIT',
        reason: `🟢 تم الوصول للهدف عند ${trade.takeProfit} - ربح ${pnlPercent.toFixed(1)}%`,
        confidence: 100,
        suggestedPrice: trade.takeProfit,
        currentPnL: pnlPercent,
        urgency: 'HIGH'
      };
    }
  }
  
  // Check max holding time
  if (trade.maxHoldingMinutes && holdingMinutes >= trade.maxHoldingMinutes) {
    return {
      tradeId: trade.id,
      action: 'EXIT_NOW',
      reason: `⏰ انتهى الوقت المحدد (${trade.maxHoldingMinutes} دقيقة)`,
      confidence: 90,
      suggestedPrice: currentPrice,
      currentPnL: pnlPercent,
      urgency: 'HIGH'
    };
  }
  
  // Check trailing stop
  if (trade.trailingStopEnabled && trade.trailingStopPercent && pnlPercent > 0) {
    const trailingDistance = trade.trailingStopPercent;
    const shouldTrail = isLong 
      ? currentPrice < trade.entryPrice * (1 + (pnlPercent - trailingDistance) / 100)
      : currentPrice > trade.entryPrice * (1 - (pnlPercent - trailingDistance) / 100);
    
    if (shouldTrail && pnlPercent > trailingDistance) {
      return {
        tradeId: trade.id,
        action: 'EXIT_NOW',
        reason: `📍 تفعيل الوقف المتحرك - حماية ربح ${pnlPercent.toFixed(1)}%`,
        confidence: 95,
        suggestedPrice: currentPrice,
        currentPnL: pnlPercent,
        urgency: 'HIGH'
      };
    }
  }
  
  // Trend reversal detection
  const trendAgainstPosition = (isLong && trendStrength < 30) || (!isLong && trendStrength > 70);
  if (trendAgainstPosition && pnlPercent < -5) {
    action = 'EXIT_SOON';
    reason = `⚠️ انعكاس محتمل في الاتجاه - خسارة ${Math.abs(pnlPercent).toFixed(1)}%`;
    urgency = 'MEDIUM';
    confidence = 70;
  }
  
  // RSI overbought/oversold
  if (isLong && rsi > 75 && pnlPercent > 5) {
    action = 'EXIT_SOON';
    reason = `🟠 RSI تشبع شرائي (${rsi.toFixed(0)}) - ربح ${pnlPercent.toFixed(1)}%`;
    urgency = 'MEDIUM';
    confidence = 75;
  } else if (!isLong && rsi < 25 && pnlPercent > 5) {
    action = 'EXIT_SOON';
    reason = `🟠 RSI تشبع بيعي (${rsi.toFixed(0)}) - ربح ${pnlPercent.toFixed(1)}%`;
    urgency = 'MEDIUM';
    confidence = 75;
  }
  
  // Large profit - suggest partial exit
  if (pnlPercent > 15) {
    action = 'TAKE_PROFIT';
    reason = `💰 ربح كبير ${pnlPercent.toFixed(1)}% - يُنصح بالخروج`;
    urgency = 'HIGH';
    confidence = 85;
  } else if (pnlPercent > 10) {
    action = 'EXIT_SOON';
    reason = `📈 ربح جيد ${pnlPercent.toFixed(1)}% - راقب الصفقة`;
    urgency = 'MEDIUM';
    confidence = 70;
  }
  
  // Large loss - warn
  if (pnlPercent < -10) {
    action = 'EXIT_NOW';
    reason = `🔴 خسارة كبيرة ${Math.abs(pnlPercent).toFixed(1)}% - يُنصح بالخروج`;
    urgency = 'CRITICAL';
    confidence = 90;
  } else if (pnlPercent < -5) {
    action = 'EXIT_SOON';
    reason = `⚠️ خسارة ${Math.abs(pnlPercent).toFixed(1)}% - راقب عن كثب`;
    urgency = 'HIGH';
    confidence = 75;
  }
  
  // Adjust trailing stop if profitable
  if (pnlPercent > 3 && trade.trailingStopEnabled) {
    action = 'ADJUST_STOP';
    reason = `📊 تحديث الوقف المتحرك لحماية الربح`;
    urgency = 'LOW';
    confidence = 80;
  }
  
  return {
    tradeId: trade.id,
    action,
    reason,
    confidence,
    suggestedPrice: action !== 'HOLD' ? currentPrice : undefined,
    currentPnL: pnlPercent,
    urgency
  };
}

// Generate market entry signals
async function generateEntrySignals(): Promise<{
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  reasons: string[];
}[]> {
  const symbols = ['SPX', 'SPY', 'QQQ'];
  
  return symbols.map(symbol => {
    const signal = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'HOLD';
    const strength = 30 + Math.random() * 70;
    const reasons: string[] = [];
    
    if (signal === 'BUY') {
      reasons.push('RSI في منطقة التشبع البيعي');
      reasons.push('MACD أعطى إشارة صعودية');
      reasons.push('السعر قرب دعم قوي');
    } else if (signal === 'SELL') {
      reasons.push('RSI في منطقة التشبع الشرائي');
      reasons.push('تقاطع سلبية في المتوسطات');
      reasons.push('قوة الاتجاه تضعفت');
    }
    
    return { symbol, signal, strength, reasons };
  });
}

// POST - Monitor all trades
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;
    
    if (action === 'monitor') {
      // Get all open trades
      const openTrades = await db.trade.findMany({
        where: {
          status: 'OPEN',
          userId: userId || 'demo'
        },
        orderBy: { openedAt: 'desc' }
      });
      
      // Analyze each trade
      const decisions: TradeDecision[] = [];
      for (const trade of openTrades) {
        const decision = await analyzeTrade({
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          quantity: trade.quantity,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          trailingStopEnabled: trade.trailingStopEnabled,
          trailingStopPercent: trade.trailingStopPercent,
          maxHoldingMinutes: trade.maxHoldingMinutes,
          openedAt: trade.openedAt || new Date()
        });
        decisions.push(decision);
      }
      
      // Generate entry signals for potential trades
      const entrySignals = await generateEntrySignals();
      
      // Get critical alerts
      const criticalAlerts = decisions.filter(d => d.urgency === 'CRITICAL');
      const highAlerts = decisions.filter(d => d.urgency === 'HIGH');
      
      return NextResponse.json({
        success: true,
        timestamp: Date.now(),
        monitoredTrades: openTrades.length,
        decisions,
        entrySignals,
        alerts: {
          critical: criticalAlerts.length,
          high: highAlerts.length,
          total: criticalAlerts.length + highAlerts.length
        },
        summary: {
          hold: decisions.filter(d => d.action === 'HOLD').length,
          exitNow: decisions.filter(d => d.action === 'EXIT_NOW').length,
          exitSoon: decisions.filter(d => d.action === 'EXIT_SOON').length,
          takeProfit: decisions.filter(d => d.action === 'TAKE_PROFIT').length,
          adjustStop: decisions.filter(d => d.action === 'ADJUST_STOP').length
        }
      });
    }
    
    if (action === 'execute_exit') {
      const { tradeId, exitPrice } = body;
      
      // Close the trade
      const trade = await db.trade.update({
        where: { id: tradeId },
        data: {
          status: 'CLOSED',
          exitPrice: exitPrice,
          closedAt: new Date()
        }
      });
      
      // Calculate P&L
      const pnl = trade.direction === 'CALL' || trade.direction === 'BUY'
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity;
      
      await db.trade.update({
        where: { id: tradeId },
        data: { pnl }
      });
      
      return NextResponse.json({
        success: true,
        message: 'تم إغلاق الصفقة بنجاح',
        trade: { ...trade, pnl }
      });
    }
    
    if (action === 'auto_entry') {
      const { symbol, direction, reason } = body;
      
      // In auto mode, the bot decides to enter a trade
      const entryPrice = 5000 + Math.random() * 100; // Simulated
      
      const trade = await db.trade.create({
        data: {
          userId: userId || 'demo',
          symbol,
          direction,
          quantity: 1,
          entryPrice,
          instrumentType: 'OPTION',
          status: 'OPEN',
          openedAt: new Date(),
          signalSource: 'AUTO_BOT',
          signalStrategy: reason
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `تم فتح صفقة ${direction} على ${symbol}`,
        trade
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Auto monitor error:', error);
    return NextResponse.json({ error: 'Monitor error' }, { status: 500 });
  }
}

// GET - Quick status check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo';
  
  try {
    const openTrades = await db.trade.count({
      where: { status: 'OPEN', userId }
    });
    
    const todayPnL = await db.trade.aggregate({
      where: {
        status: 'CLOSED',
        userId,
        closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      _sum: { pnl: true }
    });
    
    return NextResponse.json({
      success: true,
      openTrades,
      todayPnL: todayPnL._sum.pnl || 0,
      botStatus: 'MONITORING',
      lastCheck: Date.now()
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      openTrades: 0,
      todayPnL: 0,
      botStatus: 'IDLE'
    });
  }
}
