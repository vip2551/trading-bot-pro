import { NextRequest, NextResponse } from 'next/server';

/**
 * Whale Tracker API
 * متتبع حركات الحيتان في السوق
 */

// Simulated whale activity data
const whaleActivities = [
  // SPX Options
  { id: '1', symbol: 'SPX', type: 'OPTION', strike: 5050, optionType: 'CALL', size: 2500, premium: 850000, time: '2 min ago', sentiment: 'BULLISH' },
  { id: '2', symbol: 'SPX', type: 'OPTION', strike: 5100, optionType: 'PUT', size: 1800, premium: 620000, time: '5 min ago', sentiment: 'BEARISH' },
  { id: '3', symbol: 'SPX', type: 'OPTION', strike: 5075, optionType: 'CALL', size: 3200, premium: 1100000, time: '8 min ago', sentiment: 'BULLISH' },
  { id: '4', symbol: 'SPX', type: 'OPTION', strike: 5025, optionType: 'PUT', size: 1500, premium: 480000, time: '12 min ago', sentiment: 'BEARISH' },
  
  // SPY Options
  { id: '5', symbol: 'SPY', type: 'OPTION', strike: 510, optionType: 'CALL', size: 5000, premium: 450000, time: '3 min ago', sentiment: 'BULLISH' },
  { id: '6', symbol: 'SPY', type: 'OPTION', strike: 505, optionType: 'PUT', size: 3200, premium: 280000, time: '7 min ago', sentiment: 'BEARISH' },
  
  // QQQ Options
  { id: '7', symbol: 'QQQ', type: 'OPTION', strike: 485, optionType: 'CALL', size: 4200, premium: 380000, time: '4 min ago', sentiment: 'BULLISH' },
  { id: '8', symbol: 'QQQ', type: 'OPTION', strike: 480, optionType: 'PUT', size: 2800, premium: 250000, time: '10 min ago', sentiment: 'BEARISH' },
  
  // Stocks
  { id: '9', symbol: 'AAPL', type: 'STOCK', size: 50000, premium: 9500000, time: '1 min ago', sentiment: 'BULLISH' },
  { id: '10', symbol: 'TSLA', type: 'STOCK', size: 25000, premium: 4500000, time: '6 min ago', sentiment: 'BULLISH' },
  { id: '11', symbol: 'NVDA', type: 'STOCK', size: 18000, premium: 15000000, time: '9 min ago', sentiment: 'BULLISH' },
  { id: '12', symbol: 'META', type: 'STOCK', size: 15000, premium: 7200000, time: '15 min ago', sentiment: 'BULLISH' },
];

// GET - Fetch whale activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, option, stock
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '20');

    let filtered = [...whaleActivities];

    // Filter by type
    if (type === 'option') {
      filtered = filtered.filter(a => a.type === 'OPTION');
    } else if (type === 'stock') {
      filtered = filtered.filter(a => a.type === 'STOCK');
    }

    // Filter by symbol
    if (symbol) {
      filtered = filtered.filter(a => a.symbol === symbol.toUpperCase());
    }

    // Sort by time (most recent first)
    filtered.sort((a, b) => {
      const timeA = parseInt(a.time.replace(/\D/g, '')) || 0;
      const timeB = parseInt(b.time.replace(/\D/g, '')) || 0;
      return timeA - timeB;
    });

    // Apply limit
    filtered = filtered.slice(0, limit);

    // Calculate summary
    const summary = {
      totalActivity: whaleActivities.length,
      bullishCount: whaleActivities.filter(a => a.sentiment === 'BULLISH').length,
      bearishCount: whaleActivities.filter(a => a.sentiment === 'BEARISH').length,
      totalPremium: whaleActivities.reduce((sum, a) => sum + a.premium, 0),
      optionsCount: whaleActivities.filter(a => a.type === 'OPTION').length,
      stocksCount: whaleActivities.filter(a => a.type === 'STOCK').length,
    };

    // Top symbols by activity
    const symbolCounts: Record<string, number> = {};
    whaleActivities.forEach(a => {
      symbolCounts[a.symbol] = (symbolCounts[a.symbol] || 0) + 1;
    });
    const topSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, count]) => ({ symbol, count }));

    return NextResponse.json({
      success: true,
      activities: filtered,
      summary,
      topSymbols,
    });
  } catch (error) {
    console.error('Whale tracker error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch whale activities' 
    }, { status: 500 });
  }
}

// POST - Follow whale or add alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol, userId } = body;

    if (action === 'follow') {
      // In a real app, this would save to database
      return NextResponse.json({
        success: true,
        message: `Now following ${symbol} whale activity`,
      });
    }

    if (action === 'alert') {
      return NextResponse.json({
        success: true,
        message: `Alert set for ${symbol} whale movements`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
