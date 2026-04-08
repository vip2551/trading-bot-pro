import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword, action } = body;

    // Request reset
    if (action === 'request' && email) {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if user exists
        return NextResponse.json({ 
          success: true, 
          message: 'إذا كان البريد مسجلاً، ستصلك رسالة' 
        });
      }

      const resetToken = generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires }
      });

      // In production, send email with reset link
      // For demo, return the token
      return NextResponse.json({ 
        success: true, 
        message: 'تم إرسال رابط إعادة التعيين',
        // Demo only - in production, don't return this
        demoToken: resetToken 
      });
    }

    // Reset password with token
    if (action === 'reset' && token && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
      }

      const user = await db.user.findFirst({
        where: { 
          resetToken: token,
          resetExpires: { gt: new Date() }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'الرابط غير صالح أو منتهي الصلاحية' }, { status: 400 });
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashPassword(newPassword),
          resetToken: null,
          resetExpires: null
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'تم تغيير كلمة المرور بنجاح' 
      });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'فشل إعادة تعيين كلمة المرور' }, { status: 500 });
  }
}

// GET - Verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { 
        resetToken: token,
        resetExpires: { gt: new Date() }
      }
    });

    return NextResponse.json({ 
      valid: !!user,
      email: user?.email ? user.email.substring(0, 3) + '***' + user.email.split('@')[1] : null
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
