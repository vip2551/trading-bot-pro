import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Stop the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo';

    console.log('Stopping bot for user:', userId);

    // Get settings
    let settings = await db.botSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create settings if not exist
      try {
        await db.user.upsert({
          where: { id: userId },
          create: { id: userId, email: `${userId}@demo.local`, name: userId },
          update: {},
        });
        settings = await db.botSettings.create({
          data: { userId, isRunning: false },
        });
      } catch {
        return NextResponse.json({ 
          success: true, 
          message: 'Bot stopped (no settings found)',
        });
      }
    } else {
      settings = await db.botSettings.update({
        where: { id: settings.id },
        data: { isRunning: false, ibConnected: false },
      });
    }

    // Try to stop IB service
    try {
      await fetch('http://localhost:3003/bot/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    } catch {
      console.log('IB service not available');
    }

    return NextResponse.json({ 
      success: true, 
      settings,
      message: 'Bot stopped successfully',
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to stop bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
