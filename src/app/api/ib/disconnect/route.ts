import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Disconnect from Interactive Brokers
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

    // Update settings
    if (userId) {
      await db.botSettings.update({
        where: { userId },
        data: { ibConnected: false },
      }).catch(() => {});
    }
    
    return NextResponse.json({ 
      success: true,
      connected: false,
      message: 'Disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting from IB:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to disconnect' 
    }, { status: 500 });
  }
}
