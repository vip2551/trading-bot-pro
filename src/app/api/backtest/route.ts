import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch backtests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const backtestId = searchParams.get('id');

    if (backtestId) {
      const backtest = await db.backtest.findUnique({
        where: { id: backtestId },
      });
      return NextResponse.json({ backtest });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const backtests = await db.backtest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ backtests });
  } catch (error) {
    console.error('Error fetching backtests:', error);
    return NextResponse.json({ error: 'Failed to fetch backtests' }, { status: 500 });
  }
}

// POST - Create backtest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      symbol,
      timeframe,
      startDate,
      endDate,
      parameters,
    } = body;

    if (!userId || !name || !symbol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const backtest = await db.backtest.create({
      data: {
        userId,
        name,
        description,
        symbol,
        timeframe: timeframe || '1h',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        parameters: parameters ? JSON.stringify(parameters) : null,
        status: 'PENDING',
      },
    });

    // Run backtest in background
    runBacktest(backtest.id).catch(console.error);

    return NextResponse.json({ success: true, backtest });
  } catch (error) {
    console.error('Error creating backtest:', error);
    return NextResponse.json({ error: 'Failed to create backtest' }, { status: 500 });
  }
}

// DELETE - Delete backtest
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Backtest ID required' }, { status: 400 });
    }

    await db.backtest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backtest:', error);
    return NextResponse.json({ error: 'Failed to delete backtest' }, { status: 500 });
  }
}

// Simulated backtest runner
async function runBacktest(backtestId: string) {
  try {
    await db.backtest.update({
      where: { id: backtestId },
      data: { status: 'RUNNING', progress: 10 },
    });

    const backtest = await db.backtest.findUnique({ where: { id: backtestId } });
    if (!backtest) return;

    // Simulate backtest (in production, this would run actual strategy)
    const totalDays = Math.ceil((backtest.endDate.getTime() - backtest.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simulated results
    const totalTrades = Math.floor(Math.random() * 200) + 50;
    const winRate = Math.random() * 0.3 + 0.45; // 45-75%
    const winCount = Math.floor(totalTrades * winRate);
    const lossCount = totalTrades - winCount;
    const avgWin = Math.random() * 500 + 100;
    const avgLoss = Math.random() * 300 + 50;
    const totalPnL = winCount * avgWin - lossCount * avgLoss;
    const maxDrawdown = Math.random() * 20 + 5;
    const sharpeRatio = Math.random() * 2 + 0.5;
    const profitFactor = (winCount * avgWin) / (lossCount * avgLoss);

    // Update progress
    for (let i = 20; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 500));
      await db.backtest.update({
        where: { id: backtestId },
        data: { progress: i },
      });
    }

    // Generate equity curve
    const equityCurve = [];
    let equity = 10000;
    for (let i = 0; i <= totalDays; i++) {
      const dayChange = (Math.random() - 0.4) * 500;
      equity += dayChange;
      equityCurve.push({
        date: new Date(backtest.startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
        equity: Math.max(0, equity),
      });
    }

    // Generate trades
    const trades = [];
    for (let i = 0; i < totalTrades; i++) {
      const isWin = Math.random() < winRate;
      trades.push({
        entryDate: new Date(backtest.startDate.getTime() + Math.random() * (backtest.endDate.getTime() - backtest.startDate.getTime())).toISOString(),
        pnl: isWin ? avgWin * (0.5 + Math.random()) : -avgLoss * (0.5 + Math.random()),
        direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      });
    }

    await db.backtest.update({
      where: { id: backtestId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        totalTrades,
        winCount,
        lossCount,
        winRate: winRate * 100,
        totalPnL,
        maxDrawdown,
        sharpeRatio,
        profitFactor,
        averageWin: avgWin,
        averageLoss: avgLoss,
        largestWin: avgWin * 2,
        largestLoss: avgLoss * 2,
        trades: JSON.stringify(trades),
        equityCurve: JSON.stringify(equityCurve),
      },
    });
  } catch (error) {
    console.error('Backtest error:', error);
    await db.backtest.update({
      where: { id: backtestId },
      data: { status: 'FAILED' },
    });
  }
}
