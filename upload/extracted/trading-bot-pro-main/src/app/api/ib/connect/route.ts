import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Connect to Interactive Brokers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = body.userId;

    // If no userId or demo, find admin
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) userId = admin.id;
    }

    // Get settings
    const settings = await db.botSettings.findUnique({
      where: { userId },
    });

    const accountType = settings?.accountType || 'PAPER';

    // For Paper Trading mode, no IB connection needed
    if (accountType === 'PAPER') {
      // Update settings to show "connected" for paper trading
      if (settings) {
        await db.botSettings.update({
          where: { userId },
          data: { ibConnected: true },
        });
      }

      return NextResponse.json({ 
        success: true,
        connected: true,
        mode: 'PAPER',
        message: 'Paper Trading mode - no IB connection required'
      });
    }

    // For LIVE mode, try to connect to IB service
    try {
      const response = await fetch('http://localhost:3003/ib/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          host: settings?.ibHost || '127.0.0.1',
          port: settings?.ibPort || 7497,
          clientId: settings?.ibClientId || 1
        }),
      });
      
      if (response.ok) {
        await db.botSettings.update({
          where: { userId },
          data: { ibConnected: true },
        });
        
        return NextResponse.json({ 
          success: true, 
          connected: true,
          mode: 'LIVE'
        });
      }
    } catch (err) {
      console.log('IB service not available');
    }
    
    // If IB service is not running
    await db.botSettings.update({
      where: { userId },
      data: { ibConnected: false },
    }).catch(() => {});
    
    return NextResponse.json({ 
      success: false,
      connected: false,
      error: 'IB service is not running. For Paper Trading, switch to PAPER mode.',
      hint: 'If you want to use Paper Trading without IB, go to Settings and change Account Type to PAPER.'
    }, { status: 503 });
  } catch (error) {
    console.error('Error connecting to IB:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to connect to IB',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
