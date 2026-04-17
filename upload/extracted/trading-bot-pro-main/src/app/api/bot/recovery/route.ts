import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Recovery API - Called on bot startup to restore state
 * يُستدعى عند تشغيل البوت لاستعادة الحالة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Get bot settings
    const settings = userId
      ? await db.botSettings.findUnique({ where: { userId } })
      : await db.botSettings.findFirst();

    if (!settings) {
      return NextResponse.json({ error: 'No settings found' }, { status: 404 });
    }

    // Find all open trades in database
    const openTrades = await db.trade.findMany({
      where: {
        userId: userId || undefined,
        status: 'OPEN',
      },
    });

    // Find pending trades that might have been interrupted
    const pendingTrades = await db.trade.findMany({
      where: {
        userId: userId || undefined,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });

    // Find trades with trailing stops that need monitoring
    const trailingStopTrades = openTrades.filter(t => t.trailingStopEnabled);

    // Find bracket orders that need monitoring
    const bracketOrders = openTrades.filter(t => t.isBracketOrder);

    // Check for auto-close trades
    const autoCloseTrades = openTrades.filter(t => 
      t.autoCloseAt && new Date(t.autoCloseAt!) > new Date()
    );

    // Recovery summary
    const recoverySummary = {
      openTrades: openTrades.length,
      pendingTrades: pendingTrades.length,
      trailingStopTrades: trailingStopTrades.length,
      bracketOrders: bracketOrders.length,
      autoCloseTrades: autoCloseTrades.length,
      trades: openTrades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        strike: t.strike,
        hasTrailingStop: t.trailingStopEnabled,
        isBracketOrder: t.isBracketOrder,
        autoCloseAt: t.autoCloseAt,
        ibOrderId: t.ibOrderId,
      })),
    };

    // Mark bot as running with recovery flag
    await db.botSettings.update({
      where: { id: settings.id },
      data: {
        isRunning: true,
      },
    });

    // Create recovery log
    if (userId) {
      await db.auditLog.create({
        data: {
          userId,
          action: 'BOT_RECOVERY',
          entity: 'BOT',
          details: JSON.stringify(recoverySummary),
          status: 'SUCCESS',
        },
      });
    }

    return NextResponse.json({
      success: true,
      recovery: recoverySummary,
      message: `Recovered ${openTrades.length} open trades, ${trailingStopTrades.length} with trailing stops`,
    });

  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ 
      error: 'Recovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Check recovery status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const settings = userId
      ? await db.botSettings.findUnique({ where: { userId } })
      : await db.botSettings.findFirst();

    if (!settings) {
      return NextResponse.json({ needsRecovery: false });
    }

    // Check if there are open trades that might need recovery
    const openTrades = await db.trade.count({
      where: {
        userId: userId || undefined,
        status: 'OPEN',
      },
    });

    const pendingTrades = await db.trade.count({
      where: {
        userId: userId || undefined,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      needsRecovery: openTrades > 0 || pendingTrades > 0,
      openTrades,
      pendingTrades,
      botWasRunning: settings.isRunning,
      lastUpdate: settings.updatedAt,
    });

  } catch (error) {
    console.error('Recovery check error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
