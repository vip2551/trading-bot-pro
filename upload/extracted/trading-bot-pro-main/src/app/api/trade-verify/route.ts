import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify spread and liquidity before trade execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, strike, direction, quantity, userId } = body;

    // Get bot settings
    const settings = await db.botSettings.findFirst({
      where: userId ? { userId } : undefined,
    });

    if (!settings) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Settings not found' 
      }, { status: 400 });
    }

    // Simulate market data (in production, get from IB)
    const marketData = await getMarketData(symbol, strike, direction);

    // Check spread
    const spreadResult = checkSpread(marketData, settings);

    // Check liquidity
    const liquidityResult = checkLiquidity(marketData, settings, quantity);

    // Check slippage
    const slippageResult = checkSlippage(marketData, settings, quantity);

    // Calculate estimated execution price
    const executionPrice = direction === 'CALL' || direction === 'BUY'
      ? marketData.askPrice  // Buy at ask
      : marketData.bidPrice; // Sell at bid

    const isValid = spreadResult.valid && liquidityResult.valid && slippageResult.valid;

    return NextResponse.json({
      valid: isValid,
      symbol,
      strike,
      direction,
      quantity,
      marketData: {
        bid: marketData.bidPrice,
        ask: marketData.askPrice,
        last: marketData.lastPrice,
        volume: marketData.volume,
        openInterest: marketData.openInterest,
      },
      spread: {
        value: spreadResult.spreadValue,
        percent: spreadResult.spreadPercent,
        valid: spreadResult.valid,
        message: spreadResult.message,
      },
      liquidity: {
        available: liquidityResult.availableVolume,
        required: liquidityResult.requiredVolume,
        valid: liquidityResult.valid,
        message: liquidityResult.message,
      },
      slippage: {
        estimated: slippageResult.estimatedSlippage,
        percent: slippageResult.slippagePercent,
        valid: slippageResult.valid,
        message: slippageResult.message,
      },
      execution: {
        estimatedPrice: executionPrice,
        estimatedCost: executionPrice * quantity * 100, // Options: price * qty * 100
      },
      warnings: [
        ...(!spreadResult.valid ? [spreadResult.message] : []),
        ...(!liquidityResult.valid ? [liquidityResult.message] : []),
        ...(!slippageResult.valid ? [slippageResult.message] : []),
      ],
    });
  } catch (error) {
    console.error('Error verifying spread/liquidity:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to verify spread and liquidity' 
    }, { status: 500 });
  }
}

interface MarketData {
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  bidSize: number;
  askSize: number;
  volume: number;
  openInterest: number;
  high: number;
  low: number;
}

// Get market data from IB or simulate
async function getMarketData(symbol: string, strike: number | null, direction: string): Promise<MarketData> {
  // In production, this would call IB API for real data
  // For now, simulate realistic values
  
  const basePrice = symbol === 'SPX' && strike ? 350 : 100;
  const spreadFactor = symbol === 'SPX' ? 0.02 : 0.01; // SPX has tighter spreads
  
  const midPrice = basePrice + (Math.random() - 0.5) * 10;
  const halfSpread = midPrice * spreadFactor;
  
  return {
    bidPrice: midPrice - halfSpread,
    askPrice: midPrice + halfSpread,
    lastPrice: midPrice,
    bidSize: Math.floor(Math.random() * 500) + 100,
    askSize: Math.floor(Math.random() * 500) + 100,
    volume: Math.floor(Math.random() * 10000) + 1000,
    openInterest: Math.floor(Math.random() * 50000) + 5000,
    high: midPrice + 5,
    low: midPrice - 5,
  };
}

interface CheckResult {
  valid: boolean;
  message: string;
}

interface SpreadResult extends CheckResult {
  spreadValue: number;
  spreadPercent: number;
}

function checkSpread(marketData: MarketData, settings: { checkSpread: boolean; maxSpreadPercent: number }): SpreadResult {
  if (!settings.checkSpread) {
    return {
      valid: true,
      message: 'Spread check disabled',
      spreadValue: 0,
      spreadPercent: 0,
    };
  }

  const spreadValue = marketData.askPrice - marketData.bidPrice;
  const midPrice = (marketData.askPrice + marketData.bidPrice) / 2;
  const spreadPercent = (spreadValue / midPrice) * 100;

  const valid = spreadPercent <= settings.maxSpreadPercent;

  return {
    valid,
    spreadValue,
    spreadPercent,
    message: valid
      ? `Spread OK: $${spreadValue.toFixed(2)} (${spreadPercent.toFixed(2)}%)`
      : `⚠️ Spread too high: $${spreadValue.toFixed(2)} (${spreadPercent.toFixed(2)}%) > ${settings.maxSpreadPercent}%`,
  };
}

interface LiquidityResult extends CheckResult {
  availableVolume: number;
  requiredVolume: number;
}

function checkLiquidity(marketData: MarketData, settings: { checkLiquidity: boolean; minLiquidity: number }, quantity: number): LiquidityResult {
  if (!settings.checkLiquidity) {
    return {
      valid: true,
      message: 'Liquidity check disabled',
      availableVolume: 0,
      requiredVolume: 0,
    };
  }

  // Available volume is the smaller of bid and ask size
  const availableVolume = Math.min(marketData.bidSize, marketData.askSize);
  const requiredVolume = quantity;

  const valid = availableVolume >= settings.minLiquidity && availableVolume >= requiredVolume;

  return {
    valid,
    availableVolume,
    requiredVolume,
    message: valid
      ? `Liquidity OK: ${availableVolume} contracts available`
      : `⚠️ Low liquidity: Only ${availableVolume} contracts available, need ${Math.max(settings.minLiquidity, requiredVolume)}`,
  };
}

interface SlippageResult extends CheckResult {
  estimatedSlippage: number;
  slippagePercent: number;
}

function checkSlippage(marketData: MarketData, settings: { maxSlippagePercent: number }, quantity: number): SlippageResult {
  // Estimate slippage based on order size vs available liquidity
  const availableVolume = Math.min(marketData.bidSize, marketData.askSize);
  
  // Simple slippage model: larger orders = more slippage
  const slippageRatio = Math.min(quantity / availableVolume, 1);
  const spreadValue = marketData.askPrice - marketData.bidPrice;
  
  // Estimated slippage is spread + additional based on order size
  const estimatedSlippage = spreadValue * (1 + slippageRatio * 2);
  const midPrice = (marketData.askPrice + marketData.bidPrice) / 2;
  const slippagePercent = (estimatedSlippage / midPrice) * 100;

  const valid = slippagePercent <= settings.maxSlippagePercent;

  return {
    valid,
    estimatedSlippage,
    slippagePercent,
    message: valid
      ? `Slippage OK: ~$${estimatedSlippage.toFixed(2)} (${slippagePercent.toFixed(2)}%)`
      : `⚠️ High slippage expected: ~$${estimatedSlippage.toFixed(2)} (${slippagePercent.toFixed(2)}%) > ${settings.maxSlippagePercent}%`,
  };
}
