import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب قائمة المراقبة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // STOCK, OPTION, FUTURE, etc.
    const enabled = searchParams.get('enabled');

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (enabled !== null) {
      where.enabled = enabled === 'true';
    }

    const watchlist = await db.watchlistItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب قائمة المراقبة' },
      { status: 500 }
    );
  }
}

// POST - إضافة عنصر جديد لقائمة المراقبة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      symbol,
      name,
      type = 'STOCK',
      strike,
      expiry,
      optionType,
      exchange,
      currency = 'USD',
      autoTrade = false,
      quantity = 1,
      strategy = 'MIXED',
      stopLossPercent,
      takeProfitPercent,
      notes
    } = body;

    // التحقق من وجود الرمز
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'الرمز مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من عدم التكرار
    const existing = await db.watchlistItem.findFirst({
      where: {
        symbol,
        type,
        strike: strike || null,
        expiry: expiry || null,
        optionType: optionType || null
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'هذا العنصر موجود بالفعل في قائمة المراقبة' },
        { status: 400 }
      );
    }

    // الحصول على أقصى ترتيب
    const maxOrder = await db.watchlistItem.aggregate({
      _max: { sortOrder: true }
    });

    const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

    const item = await db.watchlistItem.create({
      data: {
        symbol: symbol.toUpperCase(),
        name,
        type,
        strike,
        expiry,
        optionType,
        exchange,
        currency,
        autoTrade,
        quantity,
        strategy,
        stopLossPercent,
        takeProfitPercent,
        notes,
        sortOrder,
        enabled: true
      }
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: `تمت إضافة ${symbol} إلى قائمة المراقبة`
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة العنصر' },
      { status: 500 }
    );
  }
}

// PUT - تحديث عنصر في قائمة المراقبة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العنصر مطلوب' },
        { status: 400 }
      );
    }

    const item = await db.watchlistItem.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم تحديث العنصر بنجاح'
    });
  } catch (error) {
    console.error('Error updating watchlist item:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث العنصر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف عنصر من قائمة المراقبة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العنصر مطلوب' },
        { status: 400 }
      );
    }

    await db.watchlistItem.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف العنصر من قائمة المراقبة'
    });
  } catch (error) {
    console.error('Error deleting watchlist item:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف العنصر' },
      { status: 500 }
    );
  }
}
