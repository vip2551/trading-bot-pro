import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Start the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo';

    console.log('Starting bot for user:', userId);

    // Ensure user exists
    try {
      await db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: `${userId}@demo.local`,
          name: userId,
        },
        update: {},
      });
    } catch (userError) {
      console.log('User upsert failed, continuing...', userError);
    }

    // Get or create settings
    let settings = await db.botSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.botSettings.create({
        data: { userId, isRunning: true },
      });
    } else {
      settings = await db.botSettings.update({
        where: { id: settings.id },
        data: { isRunning: true },
      });
    }

    // Get open trades for recovery info
    let openTrades: any[] = [];
    let pendingTrades: any[] = [];
    
    try {
      openTrades = await db.trade.findMany({
        where: { userId, status: 'OPEN' },
      });

      pendingTrades = await db.trade.findMany({
        where: {
          userId,
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      });
    } catch (tradeError) {
      console.log('Could not fetch trades:', tradeError);
    }

    // Recovery summary
    const recoveryInfo = {
      openTrades: openTrades.length,
      pendingTrades: pendingTrades.length,
    };

    // Try to start IB service (optional)
    let ibStatus = { connected: false, message: 'IB service not configured' };
    try {
      const ibRes = await fetch('http://localhost:3003/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(3000),
      });
      
      if (ibRes.ok) {
        ibStatus = await ibRes.json();
        
        await db.botSettings.update({
          where: { id: settings.id },
          data: { ibConnected: ibStatus.connected },
        }).catch(() => {});
      }
    } catch {
      console.log('IB service not available (this is OK for paper trading)');
    }

    return NextResponse.json({ 
      success: true, 
      settings,
      recovery: recoveryInfo,
      ibStatus,
      message: openTrades.length > 0 
        ? `Bot started. Found ${openTrades.length} open trades.` 
        : 'Bot started successfully',
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to start bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
