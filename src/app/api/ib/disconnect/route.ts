import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Disconnect from Interactive Brokers
export async function POST() {
  try {
    // Send disconnect request to IB service
    try {
      await fetch('http://localhost:3003/ib/disconnect', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to disconnect from IB service:', err);
    }
    
    // Update settings
    await db.botSettings.updateMany({
      data: { ibConnected: false },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting from IB:', error);
    return NextResponse.json({ error: 'Failed to disconnect from IB' }, { status: 500 });
  }
}
