import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default settings for demo mode (when no user settings exist)
const DEFAULT_SETTINGS = {
  defaultQuantity: 1,
  positionSizeMode: 'FIXED',
  positionSizeAmount: 500,
  positionSizePercent: 5,
  spxStrikeOffset: 5,
  spxDeltaTarget: 0.3,
  strikeSelectionMode: 'OFFSET', // Auto select strike by offset from ATM
  contractPriceMin: 300,
  contractPriceMax: 400,
  defaultExpiry: '0DTE',
  defaultStopLoss: null as number | null,
  defaultTakeProfit: null as number | null,
  accountBalance: 10000,
  telegramBotToken: null as string | null,
  telegramChatId: null as string | null,
  telegramEnabled: false,
  allowMultipleTrades: true,
  maxOpenPositions: 5,
  smartModeEnabled: false,
  maxDailyLoss: 500,
  avoidLowLiquidityHours: false,
  avoidNewsEvents: false,
  checkSpread: false,
  checkLiquidity: false,
  maxSpreadPercent: 5,
  minLiquidity: 100,
  maxSlippagePercent: 1,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Received TradingView signal:', body);

    const {
      symbol,
      action,
      strategy,
      price,
      strike,
      expiry,
      quantity,
      stop_loss,
      take_profit,
      trailing_stop_percent,
      trailing_stop_amount,
      max_holding_minutes,
    } = body;

    if (!symbol || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol and action' },
        { status: 400 }
      );
    }

    // Save signal
    const signal = await db.tradingViewSignal.create({
      data: {
        symbol,
        action: action.toUpperCase(),
        strategy: strategy || null,
        price: price ? parseFloat(price) : null,
        strike: strike ? parseFloat(strike) : null,
        expiry: expiry || null,
        quantity: quantity ? parseInt(quantity) : null,
        stopLoss: stop_loss ? parseFloat(stop_loss) : null,
        takeProfit: take_profit ? parseFloat(take_profit) : null,
        rawPayload: JSON.stringify(body),
        processed: false,
      },
    });

    console.log('✅ Signal saved:', signal.id);

    // Get bot settings or use defaults
    const settings = await db.botSettings.findFirst();
    const effectiveSettings = settings || DEFAULT_SETTINGS;

    console.log('📊 Bot settings:', {
      hasSettings: !!settings,
      telegramEnabled: effectiveSettings.telegramEnabled,
      telegramChatId: effectiveSettings.telegramChatId ? 'SET' : 'NOT SET'
    });

    // Always process signal
    processSignal(signal.id, effectiveSettings as any, {
      trailingStopPercent: trailing_stop_percent ? parseFloat(trailing_stop_percent) : null,
      trailingStopAmount: trailing_stop_amount ? parseFloat(trailing_stop_amount) : null,
      maxHoldingMinutes: max_holding_minutes ? parseInt(max_holding_minutes) : null,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      signalId: signal.id,
      message: 'Signal received and processing',
    });
  } catch (error) {
    console.error('❌ Error processing TradingView webhook:', error);
    return NextResponse.json({ error: 'Failed to process signal' }, { status: 500 });
  }
}

interface TrailingStopData {
  trailingStopPercent: number | null;
  trailingStopAmount: number | null;
  maxHoldingMinutes: number | null;
}

interface BotSettingsFull {
  defaultQuantity: number;
  spxStrikeOffset: number;
  spxDeltaTarget: number;
  strikeSelectionMode: string;
  contractPriceMin: number;
  contractPriceMax: number;
  positionSizeMode: string;
  positionSizePercent: number;
  positionSizeAmount: number;
  defaultExpiry: string;
  defaultStopLoss: number | null;
  defaultTakeProfit: number | null;
  accountBalance: number | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  telegramEnabled: boolean;
  allowMultipleTrades: boolean;
  maxOpenPositions: number;
  smartModeEnabled: boolean;
  maxDailyLoss: number;
  avoidLowLiquidityHours: boolean;
  avoidNewsEvents: boolean;
  checkSpread: boolean;
  checkLiquidity: boolean;
  maxSpreadPercent: number;
  minLiquidity: number;
  maxSlippagePercent: number;
}

async function processSignal(
  signalId: string,
  settings: BotSettingsFull,
  trailingData: TrailingStopData
) {
  try {
    console.log('🔄 Processing signal:', signalId);
    
    const signal = await db.tradingViewSignal.findUnique({ where: { id: signalId } });
    if (!signal) {
      console.log('❌ Signal not found:', signalId);
      return;
    }

    // Check for existing open trades (Multiple Trades Control)
    const openTradesCount = await db.trade.count({
      where: { status: 'OPEN' },
    });

    if (!settings.allowMultipleTrades && openTradesCount > 0) {
      console.log('⚠️ Signal rejected: A trade is already open. allowMultipleTrades is disabled.');
      await db.tradingViewSignal.update({
        where: { id: signalId },
        data: { 
          processed: true, 
          processedAt: new Date(),
        },
      });
      return;
    }

    if (settings.allowMultipleTrades && settings.maxOpenPositions > 0 && openTradesCount >= settings.maxOpenPositions) {
      console.log(`⚠️ Signal rejected: Maximum open positions (${settings.maxOpenPositions}) reached.`);
      await db.tradingViewSignal.update({
        where: { id: signalId },
        data: { 
          processed: true, 
          processedAt: new Date(),
        },
      });
      return;
    }

    // Smart Trading Mode checks
    if (settings.smartModeEnabled) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayClosedTrades = await db.trade.findMany({
        where: {
          status: 'CLOSED',
          closedAt: { gte: today },
        },
        select: { pnl: true },
      });
      const todayPnL = todayClosedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      if (todayPnL < -settings.maxDailyLoss) {
        console.log(`⚠️ Signal rejected: Daily loss limit ($${settings.maxDailyLoss}) reached.`);
        await db.tradingViewSignal.update({
          where: { id: signalId },
          data: { processed: true, processedAt: new Date() },
        });
        return;
      }

      if (settings.avoidLowLiquidityHours) {
        const now = new Date();
        const etHour = (now.getUTCHours() - 5 + 24) % 24;
        if (etHour < 9.5 || etHour >= 16) {
          console.log('⚠️ Signal rejected: Low liquidity period (pre-market/after-hours).');
          await db.tradingViewSignal.update({
            where: { id: signalId },
            data: { processed: true, processedAt: new Date() },
          });
          return;
        }
      }
    }

    // Determine instrument type and option type
    let instrumentType = 'OPTION';
    let optionType: 'CALL' | 'PUT' | null = null;
    
    // Normalize action to uppercase
    const normalizedAction = signal.action.toUpperCase();
    
    if (['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META'].includes(signal.symbol)) {
      instrumentType = 'STOCK';
    } else if (['ES', 'NQ', 'YM', 'RTY'].includes(signal.symbol)) {
      instrumentType = 'FUTURE';
    } else if (signal.symbol.includes('USD')) {
      instrumentType = 'FOREX';
    } else if (signal.symbol === 'SPX') {
      instrumentType = 'OPTION';
      // Determine option type based on action
      if (normalizedAction === 'CALL' || normalizedAction === 'BUY') {
        optionType = 'CALL';
      } else if (normalizedAction === 'PUT' || normalizedAction === 'SELL') {
        optionType = 'PUT';
      } else {
        // Default based on common conventions
        optionType = 'CALL';
      }
    }

    // Calculate strike based on selection mode
    let calculatedStrike = signal.strike;
    
    // Auto-calculate strike for SPX options if not provided
    if (signal.symbol === 'SPX') {
      const actionForStrike = optionType || normalizedAction;
      calculatedStrike = await calculateStrike(settings, actionForStrike);
      console.log(`🎯 Auto-calculated strike: ${calculatedStrike} for ${actionForStrike} using mode: ${settings.strikeSelectionMode}`);
    }

    // Calculate quantity
    let calculatedQuantity = signal.quantity || settings.defaultQuantity || 1;
    
    if (!signal.quantity) {
      calculatedQuantity = await calculatePositionSize(settings, calculatedStrike);
    }

    // Calculate auto close time
    const autoCloseAt = signal.expiry?.includes('DTE') && signal.expiry !== '0DTE'
      ? new Date(Date.now() + parseInt(signal.expiry) * 86400000)
      : null;

    // Determine stop loss and take profit
    const stopLoss = signal.stopLoss || settings.defaultStopLoss;
    const takeProfit = signal.takeProfit || settings.defaultTakeProfit;

    console.log('📝 Creating trade with:', {
      symbol: signal.symbol,
      direction: signal.action,
      quantity: calculatedQuantity,
      strike: calculatedStrike,
    });

    // Create trade
    const trade = await db.trade.create({
      data: {
        symbol: signal.symbol,
        instrumentType,
        direction: signal.action,
        quantity: calculatedQuantity,
        entryPrice: signal.price || 0,
        strike: calculatedStrike,
        optionType,
        expiry: signal.expiry || settings.defaultExpiry || '0DTE',
        status: 'PENDING',
        stopLoss,
        takeProfit,
        trailingStopEnabled: !!trailingData.trailingStopPercent || !!trailingData.trailingStopAmount,
        trailingStopPercent: trailingData.trailingStopPercent,
        trailingStopAmount: trailingData.trailingStopAmount,
        maxHoldingMinutes: trailingData.maxHoldingMinutes || (signal.expiry === '0DTE' ? 390 : null),
        autoCloseAt,
      },
    });

    console.log('✅ Trade created:', trade.id);

    // Log
    await db.tradeLog.create({
      data: {
        tradeId: trade.id,
        action: 'CREATED',
        details: `Trade from TradingView: ${signal.strategy || 'Unknown'} - Strike Mode: ${settings.strikeSelectionMode}`,
      },
    });

    // Send to IB service
    try {
      await fetch('http://localhost:3003/trade/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          quantity: trade.quantity,
          strike: trade.strike,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
        }),
      });
    } catch {
      console.log('ℹ️ IB service not available (expected for Paper Trading)');
    }

    // Send Telegram notification
    if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      console.log('📤 Sending Telegram notification...');
      
      // Determine emoji based on option type
      const emoji = optionType === 'CALL' ? '📈' : optionType === 'PUT' ? '📉' : '📊';
      const directionLabel = optionType ? `${optionType} Option` : normalizedAction;
      
      const message = `${emoji} *New Trade Opened*\n\n` +
        `📊 *Symbol:* ${signal.symbol}\n` +
        `🎯 *Type:* ${directionLabel}\n` +
        `📦 *Quantity:* ${trade.quantity}\n` +
        (calculatedStrike ? `📍 *Strike:* ${calculatedStrike}\n` : '') +
        (signal.price ? `💰 *Entry:* $${signal.price}\n` : '') +
        (signal.strategy ? `📋 *Strategy:* ${signal.strategy}\n` : '') +
        `📊 *Mode:* ${settings.strikeSelectionMode}\n` +
        `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
        `_Auto strike selection: ${settings.strikeSelectionMode}_`;

      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
        
        const telegramResult = await telegramResponse.json();
        console.log('📱 Telegram response:', telegramResult.ok ? 'SUCCESS' : telegramResult.description);
      } catch (telegramError) {
        console.error('❌ Telegram error:', telegramError);
      }
    } else {
      console.log('ℹ️ Telegram notifications disabled or not configured');
    }

    // Mark signal processed
    await db.tradingViewSignal.update({
      where: { id: signalId },
      data: { processed: true, processedAt: new Date(), tradeId: trade.id },
    });

    console.log('✅ Signal processing complete:', signalId);

  } catch (error) {
    console.error('❌ Error processing signal:', error);
  }
}

async function calculateStrike(settings: BotSettingsFull, action: string): Promise<number | null> {
  const mode = settings.strikeSelectionMode;
  
  // Get current SPX spot price
  let spotPrice = 5800; // Default fallback
  try {
    const priceRes = await fetch('http://localhost:3003/market/spx');
    if (priceRes.ok) {
      const priceData = await priceRes.json();
      spotPrice = priceData.price;
      console.log(`📈 SPX Spot Price: ${spotPrice}`);
    }
  } catch {
    console.log('⚠️ Could not get SPX price from IB service, using default:', spotPrice);
  }

  // Normalize action - treat BUY as CALL, SELL as PUT
  const isCall = action === 'CALL' || action === 'BUY';
  const isPut = action === 'PUT' || action === 'SELL';

  switch (mode) {
    case 'CONTRACT_PRICE':
      return await findStrikeByContractPrice(spotPrice, action, settings.contractPriceMin, settings.contractPriceMax);
    
    case 'OFFSET':
      const offset = settings.spxStrikeOffset || 5;
      // For CALLS: strike is ABOVE spot (OTM calls)
      // For PUTS: strike is BELOW spot (OTM puts)
      if (isCall) {
        const strike = Math.ceil((spotPrice + offset) / 5) * 5;
        console.log(`📍 CALL strike: ${strike} (spot ${spotPrice} + offset ${offset})`);
        return strike;
      } else {
        const strike = Math.floor((spotPrice - offset) / 5) * 5;
        console.log(`📍 PUT strike: ${strike} (spot ${spotPrice} - offset ${offset})`);
        return strike;
      }
    
    case 'DELTA':
      return await findStrikeByDelta(spotPrice, action, settings.spxDeltaTarget);
    
    case 'MANUAL':
    default:
      // For MANUAL mode, still calculate a default ATM strike
      const atmStrike = Math.round(spotPrice / 5) * 5;
      if (isCall) {
        return Math.ceil((spotPrice + 5) / 5) * 5; // Slightly OTM for calls
      } else {
        return Math.floor((spotPrice - 5) / 5) * 5; // Slightly OTM for puts
      }
  }
}

async function findStrikeByContractPrice(
  spotPrice: number,
  action: string,
  minPrice: number,
  maxPrice: number
): Promise<number> {
  const atmStrike = Math.round(spotPrice / 5) * 5;
  const estimatedATMPremium = spotPrice * 0.005;
  const premiumPerPoint = 2;
  const targetPremium = (minPrice + maxPrice) / 2;
  
  // Normalize action - treat BUY as CALL, SELL as PUT
  const isCall = action === 'CALL' || action === 'BUY';
  
  if (estimatedATMPremium > targetPremium) {
    const premiumDiff = estimatedATMPremium - targetPremium;
    const pointsNeeded = premiumDiff / premiumPerPoint;
    
    if (isCall) {
      return Math.ceil((spotPrice + pointsNeeded) / 5) * 5;
    } else {
      return Math.floor((spotPrice - pointsNeeded) / 5) * 5;
    }
  } else {
    if (isCall) {
      return Math.ceil((spotPrice + 5) / 5) * 5;
    } else {
      return Math.floor((spotPrice - 5) / 5) * 5;
    }
  }
}

async function findStrikeByDelta(
  spotPrice: number,
  action: string,
  targetDelta: number
): Promise<number> {
  const deltaDiff = 0.50 - targetDelta;
  const percentOTM = deltaDiff / 0.02;
  const pointsOTM = spotPrice * (percentOTM / 100);
  
  // Normalize action - treat BUY as CALL, SELL as PUT
  const isCall = action === 'CALL' || action === 'BUY';
  
  if (isCall) {
    return Math.ceil((spotPrice + pointsOTM) / 5) * 5;
  } else {
    return Math.floor((spotPrice - pointsOTM) / 5) * 5;
  }
}

async function calculatePositionSize(
  settings: BotSettingsFull,
  strike: number | null
): Promise<number> {
  const mode = settings.positionSizeMode;
  
  switch (mode) {
    case 'PERCENTAGE':
      const balance = settings.accountBalance || 10000;
      const tradeAmount = (balance * settings.positionSizePercent) / 100;
      const estimatedPremium = strike ? 350 : 100;
      return Math.max(1, Math.floor(tradeAmount / estimatedPremium));
    
    case 'AMOUNT':
      const estimatedPremiumForAmount = strike ? 350 : 100;
      return Math.max(1, Math.floor(settings.positionSizeAmount / estimatedPremiumForAmount));
    
    case 'QUANTITY':
    default:
      return settings.defaultQuantity || 1;
  }
}
