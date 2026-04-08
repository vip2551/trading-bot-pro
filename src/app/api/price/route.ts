import { NextRequest, NextResponse } from 'next/server';

// Cache for prices (1 minute TTL)
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute

// Fallback simulated prices for demo
const SIMULATED_PRICES: Record<string, number> = {
  SPX: 5850.50,
  SPY: 585.25,
  QQQ: 485.75,
  IWM: 205.30,
  AAPL: 195.50,
  TSLA: 245.80,
  MSFT: 420.25,
  GOOGL: 175.60,
  AMZN: 185.40,
  NVDA: 875.30,
  META: 505.75,
};

// Get price from IB service or simulate
async function getPrice(symbol: string): Promise<number> {
  // Check cache first
  const cached = priceCache[symbol];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  // Try to get real price from IB service
  try {
    const res = await fetch('http://localhost:3003/market/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.price) {
        priceCache[symbol] = { price: data.price, timestamp: Date.now() };
        return data.price;
      }
    }
  } catch {
    // IB service not available
  }

  // Simulate price movement
  const basePrice = SIMULATED_PRICES[symbol] || 100;
  const randomChange = (Math.random() - 0.5) * basePrice * 0.001; // 0.1% random movement
  const price = basePrice + randomChange;
  
  priceCache[symbol] = { price, timestamp: Date.now() };
  return price;
}

// Get option price based on spot price and strike
function getOptionPrice(
  spotPrice: number, 
  strike: number, 
  optionType: 'CALL' | 'PUT',
  daysToExpiry: number = 0
): number {
  // Simple Black-Scholes approximation for demo
  const timeToExpiry = Math.max(daysToExpiry, 0.1) / 365;
  const riskFreeRate = 0.05;
  const volatility = 0.20;
  
  // Simplified pricing
  const intrinsicValue = optionType === 'CALL' 
    ? Math.max(0, spotPrice - strike) 
    : Math.max(0, strike - spotPrice);
  
  const timeValue = spotPrice * volatility * Math.sqrt(timeToExpiry) * 0.4;
  
  return Math.max(0.5, intrinsicValue + timeValue * 0.1);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const strike = searchParams.get('strike');
    const optionType = searchParams.get('optionType') as 'CALL' | 'PUT' | null;
    const daysToExpiry = parseFloat(searchParams.get('dte') || '0');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const spotPrice = await getPrice(symbol);
    
    if (strike && optionType) {
      const optionPrice = getOptionPrice(
        spotPrice, 
        parseFloat(strike), 
        optionType, 
        daysToExpiry
      );
      
      return NextResponse.json({
        symbol,
        spotPrice,
        strike: parseFloat(strike),
        optionType,
        optionPrice,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      symbol,
      price: spotPrice,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting price:', error);
    return NextResponse.json({ error: 'Failed to get price' }, { status: 500 });
  }
}

// POST endpoint for batch price requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 });
    }

    const prices: Record<string, { price: number; timestamp: string }> = {};
    
    for (const symbol of symbols) {
      const price = await getPrice(symbol);
      prices[symbol] = {
        price,
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error getting batch prices:', error);
    return NextResponse.json({ error: 'Failed to get prices' }, { status: 500 });
  }
}
