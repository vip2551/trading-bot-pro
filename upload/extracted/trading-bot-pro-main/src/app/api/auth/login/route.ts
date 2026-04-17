import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    // Find user
    const user = await db.user.findUnique({
      where: { email: emailLower },
      select: { id: true, email: true, name: true, password: true, isAdmin: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير موجود' }, { status: 401 });
    }

    if (!user.password || user.password !== hashedPassword) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      message: 'تم تسجيل الدخول بنجاح'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'فشل تسجيل الدخول',
      details: error.message 
    }, { status: 500 });
  }
}