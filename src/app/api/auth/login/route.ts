import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

// Generate TOTP code
function generateTwoFactorCode(secret: string): string {
  const time = Math.floor(Date.now() / 30000);
  const hmac = crypto.createHmac('sha1', secret || 'default').update(time.toString()).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 |
                (hmac[offset + 1] & 0xff) << 16 |
                (hmac[offset + 2] & 0xff) << 8 |
                (hmac[offset + 3] & 0xff)) % 1000000;
  return code.toString().padStart(6, '0');
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorCode } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { 
        subscription: { include: { plan: true } },
        botSettings: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Check password
    if (user.password && user.password !== hashPassword(password)) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json({ 
          requiresTwoFactor: true,
          message: 'مطلوب المصادقة الثنائية'
        }, { status: 200 });
      }
      
      const expectedCode = generateTwoFactorCode(user.twoFactorSecret || '');
      if (twoFactorCode !== expectedCode) {
        return NextResponse.json({ error: 'رمز المصادقة الثنائية غير صحيح' }, { status: 401 });
      }
    }

    // Check subscription status
    const hasActiveSubscription = user.subscription && 
      user.subscription.status === 'ACTIVE' &&
      (!user.subscription.currentPeriodEnd || new Date(user.subscription.currentPeriodEnd) > new Date());

    // Return user info (without password)
    const { password: _, twoFactorSecret: __, resetToken: ___, verificationToken: ____, ...userSafe } = user;

    // Log login
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        status: 'SUCCESS'
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        ...userSafe,
        hasActiveSubscription
      },
      message: 'تم تسجيل الدخول بنجاح'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 });
  }
}
