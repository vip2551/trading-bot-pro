import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;
    const body = await request.json();
    const { status, fillPrice, ibOrderId, filled } = body;

    const trade = await db.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ibOrderId };
    
    if (status === 'Filled' || status === 'OPEN') {
      updateData.status = 'OPEN';
      updateData.entryPrice = fillPrice;
      updateData.openedAt = new Date();
      updateData.filledQuantity = filled || trade.quantity;
    } else if (status === 'PartiallyFilled' || status === 'PARTIALLY_FILLED') {
      updateData.status = 'PARTIALLY_FILLED';
      updateData.filledQuantity = filled || trade.filledQuantity;
    } else if (status === 'Cancelled' || status === 'CLOSED') {
      updateData.status = 'CLOSED';
      updateData.exitPrice = fillPrice || trade.entryPrice;
      updateData.closedAt = new Date();

      if (trade.entryPrice && fillPrice) {
        const direction = trade.direction;
        const pnl = direction === 'CALL' || direction === 'BUY'
          ? (fillPrice - trade.entryPrice) * trade.filledQuantity
          : (trade.entryPrice - fillPrice) * trade.filledQuantity;
        const pnlPercent = ((fillPrice - trade.entryPrice) / trade.entryPrice) * 100;
        Object.assign(updateData, { pnl, pnlPercent });
      }
    }

    const updatedTrade = await db.trade.update({
      where: { id: tradeId },
      data: updateData,
    });

    await db.tradeLog.create({
      data: {
        tradeId,
        action: status === 'Filled' ? 'OPENED' : status === 'Cancelled' ? 'CLOSED' : 'MODIFIED',
        details: `Status: ${status}, Price: ${fillPrice}`,
        price: fillPrice,
      },
    });

    return NextResponse.json({ success: true, trade: updatedTrade });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}
