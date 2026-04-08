import { NextRequest, NextResponse } from 'next/server';

// Trigger daily report manually
export async function POST(request: NextRequest) {
  try {
    // Call the daily report service
    const res = await fetch('http://localhost:3005/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    
    if (data.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Daily report sent to Telegram' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.message || 'Failed to send report' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error triggering daily report:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to trigger daily report' 
    }, { status: 500 });
  }
}

// Get report preview
export async function GET(request: NextRequest) {
  try {
    const res = await fetch('http://localhost:3005/preview');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting report preview:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get report preview' 
    }, { status: 500 });
  }
}
