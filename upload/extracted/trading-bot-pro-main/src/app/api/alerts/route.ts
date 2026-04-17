import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Price Alerts API
 * نظام التنبيهات السعرية
 */

// GET - Get all alerts for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const alerts = await db.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST - Create new price alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      symbol,
      targetType,
      targetValue,
      condition,
      notifyVia = ['TELEGRAM'],
      message,
      repeatable = false,
    } = body;

    if (!userId || !symbol || !targetValue || !condition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alert = await db.priceAlert.create({
      data: {
        userId,
        symbol,
        targetType: targetType || 'PRICE',
        targetValue,
        condition,
        notifyVia: JSON.stringify(notifyVia),
        customMessage: message,
        repeatable,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      alert,
      message: `Alert created: ${symbol} ${condition} $${targetValue}`,
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

// PUT - Update alert
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, ...updates } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    }

    const alert = await db.priceAlert.update({
      where: { id: alertId },
      data: updates,
    });

    return NextResponse.json({ success: true, alert });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

// DELETE - Delete alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    }

    await db.priceAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true, message: 'Alert deleted' });

  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
