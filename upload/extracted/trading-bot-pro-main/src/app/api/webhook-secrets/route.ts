import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// GET - جلب مفاتيح الـ Webhook
export async function GET(request: NextRequest) {
  try {
    const secrets = await db.webhookSecret.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        secret: true,
        name: true,
        active: true,
        lastUsedAt: true,
        useCount: true,
        createdAt: true
      }
    });

    // إخفاء جزء من المفتاح للأمان
    const maskedSecrets = secrets.map(s => ({
      ...s,
      secret: s.secret.substring(0, 8) + '...' + s.secret.substring(s.secret.length - 4)
    }));

    return NextResponse.json({
      success: true,
      data: maskedSecrets
    });
  } catch (error) {
    console.error('Error fetching webhook secrets:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب مفاتيح الـ Webhook' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مفتاح webhook جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions, ipWhitelist, rateLimit } = body;

    // توليد مفتاح سري عشوائي
    const secret = crypto.randomBytes(32).toString('hex');

    const webhookSecret = await db.webhookSecret.create({
      data: {
        secret,
        name: name || 'Webhook Key',
        permissions: JSON.stringify(permissions || ['TRADE', 'SIGNAL', 'STATUS']),
        ipWhitelist: ipWhitelist ? JSON.stringify(ipWhitelist) : null,
        rateLimit: rateLimit || 60,
        active: true
      }
    });

    return NextResponse.json({
      success: true,
      data: webhookSecret,
      message: 'تم إنشاء مفتاح الـ Webhook بنجاح'
    });
  } catch (error) {
    console.error('Error creating webhook secret:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء مفتاح الـ Webhook' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مفتاح webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المفتاح مطلوب' },
        { status: 400 }
      );
    }

    // عدم السماح بتحديث المفتاح السري نفسه
    if (updates.secret) {
      delete updates.secret;
    }

    if (updates.permissions) {
      updates.permissions = JSON.stringify(updates.permissions);
    }

    if (updates.ipWhitelist) {
      updates.ipWhitelist = JSON.stringify(updates.ipWhitelist);
    }

    const webhookSecret = await db.webhookSecret.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({
      success: true,
      data: webhookSecret,
      message: 'تم تحديث المفتاح بنجاح'
    });
  } catch (error) {
    console.error('Error updating webhook secret:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المفتاح' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مفتاح webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المفتاح مطلوب' },
        { status: 400 }
      );
    }

    await db.webhookSecret.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المفتاح بنجاح'
    });
  } catch (error) {
    console.error('Error deleting webhook secret:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المفتاح' },
      { status: 500 }
    );
  }
}
