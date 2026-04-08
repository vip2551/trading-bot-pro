import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: { status?: string } = {};
    if (status) where.status = status;

    // Get ALL trades (demo mode - no userId filtering)
    const trades = await db.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        notifications: true,
        logs: true,
      },
    });

    console.log(`📊 Found ${trades.length} trades`);
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ trades: [] }, { status: 200 });
  }
}
