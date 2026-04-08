import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - جلب سجل الإشارات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // RECEIVED, VALIDATED, EXECUTED, FAILED, IGNORED
    const symbol = searchParams.get('symbol');
    const source = searchParams.get('source');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (symbol) {
      where.symbol = symbol.toUpperCase();
    }

    if (source) {
      where.source = source;
    }

    // جلب الإشارات
    const signals = await db.signalLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // جلب العدد الإجمالي
    const total = await db.signalLog.count({ where });

    // إحصائيات
    const stats = await db.signalLog.groupBy({
      by: ['status'],
      _count: true
    });

    const statsObj: any = {};
    stats.forEach(s => {
      statsObj[s.status] = s._count;
    });

    return NextResponse.json({
      success: true,
      data: signals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        total: total,
        received: statsObj.RECEIVED || 0,
        validated: statsObj.VALIDATED || 0,
        executed: statsObj.EXECUTED || 0,
        failed: statsObj.FAILED || 0,
        ignored: statsObj.IGNORED || 0
      }
    });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب سجل الإشارات' },
      { status: 500 }
    );
  }
}

// DELETE - حذف إشارة أو مسح السجل
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';
    const before = searchParams.get('before'); // تاريخ لحذف الإشارات قبله

    if (clearAll) {
      // مسح كل الإشارات
      await db.signalLog.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'تم مسح سجل الإشارات بالكامل'
      });
    }

    if (before) {
      // حذف الإشارات قبل تاريخ معين
      const date = new Date(before);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, error: 'تاريخ غير صالح' },
          { status: 400 }
        );
      }

      const result = await db.signalLog.deleteMany({
        where: {
          createdAt: { lt: date }
        }
      });

      return NextResponse.json({
        success: true,
        message: `تم حذف ${result.count} إشارة`
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الإشارة مطلوب' },
        { status: 400 }
      );
    }

    await db.signalLog.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإشارة'
    });
  } catch (error) {
    console.error('Error deleting signal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الإشارة' },
      { status: 500 }
    );
  }
}
