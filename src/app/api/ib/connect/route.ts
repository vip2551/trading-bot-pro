import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Connect to Interactive Brokers
export async function POST() {
  try {
    // Send connect request to IB service
    try {
      const response = await fetch('http://localhost:3003/ib/connect', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update settings
        await db.botSettings.updateMany({
          data: { ibConnected: true },
        });
        
        return NextResponse.json({ success: true });
      }
    } catch (err) {
      console.error('Failed to connect to IB service:', err);
    }
    
    // If IB service is not running, update settings anyway
    await db.botSettings.updateMany({
      data: { ibConnected: false },
    });
    
    return NextResponse.json({ 
      error: 'IB service is not running. Please start the TWS/Gateway first.' 
    }, { status: 503 });
  } catch (error) {
    console.error('Error connecting to IB:', error);
    return NextResponse.json({ error: 'Failed to connect to IB' }, { status: 500 });
  }
}
