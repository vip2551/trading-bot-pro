import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;
    const body = await request.json();
    const { trailingStopAmount, trailingStopPercent } = body;

    const trade = await db.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'OPEN' && trade.status !== 'PENDING') {
      return NextResponse.json({ error: 'Trade is not open' }, { status: 400 });
    }

    // Update trade
    const updatedTrade = await db.trade.update({
      where: { id: tradeId },
      data: {
        trailingStopEnabled: true,
        trailingStopAmount,
        trailingStopPercent,
        updatedAt: new Date(),
      },
    });

    // Log
    await db.tradeLog.create({
      data: {
        tradeId,
        action: 'MODIFIED',
        details: `Trailing stop set: ${trailingStopPercent ? trailingStopPercent + '%' : '$' + trailingStopAmount}`,
      },
    });

    // Send to IB service
    try {
      await fetch('http://localhost:3003/trade/trailing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, amount: trailingStopAmount, percent: trailingStopPercent }),
      });
    } catch {
      console.log('IB service not available');
    }

    return NextResponse.json({ success: true, trade: updatedTrade });
  } catch (error) {
    console.error('Error updating trailing stop:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
