import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST - Register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    // Get default plan (TRIAL)
    let defaultPlan = await db.plan.findFirst({
      where: { name: 'TRIAL' }
    });

    if (!defaultPlan) {
      // Create default plans if they don't exist
      defaultPlan = await db.plan.create({
        data: {
          name: 'TRIAL',
          displayName: 'تجريبي مجاني',
          description: 'تجربة مجانية لمدة 7 أيام',
          priceMonthly: 0,
          priceYearly: 0,
          maxTradesPerDay: 5,
          maxActiveTrades: 2,
          trialDays: 7,
          features: JSON.stringify(['5 صفقات يومياً', 'صفقتان نشطتان', 'إشعارات تيليجرام', 'دعم فني']),
          isActive: true,
          sortOrder: 1
        }
      });
    }

    // Create user with trial subscription
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password: hashPassword(password),
        verificationToken: generateToken(),
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        subscription: {
          create: {
            planId: defaultPlan.id,
            planName: 'TRIAL',
            status: 'ACTIVE',
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxTradesPerDay: defaultPlan.maxTradesPerDay,
            maxActiveTrades: defaultPlan.maxActiveTrades
          }
        }
      },
      include: {
        subscription: { include: { plan: true } }
      }
    });

    const { password: _, twoFactorSecret: __, resetToken: ___, verificationToken: ____, ...userSafe } = user;

    return NextResponse.json({
      success: true,
      user: userSafe,
      message: 'تم إنشاء الحساب بنجاح! لديك 7 أيام تجريبية مجانية'
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'فشل إنشاء الحساب' }, { status: 500 });
  }
}
