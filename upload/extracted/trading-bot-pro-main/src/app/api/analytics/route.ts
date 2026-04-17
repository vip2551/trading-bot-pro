import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const range = searchParams.get('range') || '30'; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(range));

    if (userId) {
      // User-specific analytics
      const [trades, signals] = await Promise.all([
        db.trade.findMany({
          where: {
            userId,
            createdAt: { gte: daysAgo },
          },
          include: { logs: true },
        }),
        db.tradingViewSignal.findMany({
          where: {
            userId,
            createdAt: { gte: daysAgo },
          },
        }),
      ]);

      // Calculate metrics
      const closedTrades = trades.filter(t => t.status === 'CLOSED');
      const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
      const losses = closedTrades.filter(t => (t.pnl || 0) <= 0);
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgPnL = closedTrades.length ? totalPnL / closedTrades.length : 0;
      const maxDrawdown = Math.min(...closedTrades.map(t => t.pnl || 0));

      // Daily breakdown
      const dailyData: Record<string, { date: string; trades: number; pnl: number }> = {};
      trades.forEach(trade => {
        const date = trade.createdAt.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, trades: 0, pnl: 0 };
        }
        dailyData[date].trades++;
        if (trade.pnl) dailyData[date].pnl += trade.pnl;
      });

      // Symbol breakdown
      const symbolStats: Record<string, { count: number; pnl: number }> = {};
      trades.forEach(trade => {
        if (!symbolStats[trade.symbol]) {
          symbolStats[trade.symbol] = { count: 0, pnl: 0 };
        }
        symbolStats[trade.symbol].count++;
        if (trade.pnl) symbolStats[trade.symbol].pnl += trade.pnl;
      });

      return NextResponse.json({
        summary: {
          totalTrades: trades.length,
          closedTrades: closedTrades.length,
          wins: wins.length,
          losses: losses.length,
          winRate: closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0,
          totalPnL,
          avgPnL,
          maxDrawdown,
          signalsReceived: signals.length,
        },
        dailyData: Object.values(dailyData),
        symbolStats: Object.entries(symbolStats).map(([symbol, data]) => ({
          symbol,
          ...data,
        })),
      });
    }

    // System-wide analytics (Admin)
    const [totalUsers, activeUsers, totalTrades, dailyStats] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          trades: {
            some: {
              createdAt: { gte: daysAgo },
            },
          },
        },
      }),
      db.trade.count(),
      db.dailyStats.findMany({
        where: { date: { gte: daysAgo } },
        orderBy: { date: 'asc' },
      }),
    ]);

    return NextResponse.json({
      summary: {
        totalUsers,
        activeUsers,
        totalTrades,
      },
      dailyStats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
