import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, setupKey } = body;

    // Check setup key
    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'trading-bot-admin-2024';
    
    if (setupKey !== validSetupKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid setup key',
        hint: 'Make sure ADMIN_SETUP_KEY is set in Railway variables'
      }, { status: 403 });
    }

    // Check if admin exists
    try {
      const existingAdmin = await db.user.findFirst({
        where: { isAdmin: true }
      });

      if (existingAdmin) {
        return NextResponse.json({ 
          success: false,
          error: 'Admin already exists',
          adminEmail: existingAdmin.email
        }, { status: 400 });
      }
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: 'User table does not exist. Run database setup first.',
        details: e.message
      }, { status: 500 });
    }

    // Create admin
    const adminEmail = email || 'admin@tradingbot.com';
    const adminPassword = password || 'Admin@123456';

    try {
      const admin = await db.user.create({
        data: {
          email: adminEmail,
          name: 'Admin',
          password: hashPassword(adminPassword),
          isAdmin: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        }
      });

      // Create subscription
      try {
        await db.subscription.create({
          data: {
            userId: admin.id,
            planName: 'ENTERPRISE',
            status: 'ACTIVE',
            isTrial: false,
            maxTradesPerDay: -1,
            maxActiveTrades: -1,
          }
        });
      } catch (e) {
        console.log('Subscription creation skipped');
      }

      // Create bot settings
      try {
        await db.botSettings.create({
          data: {
            userId: admin.id,
            isRunning: false,
            accountType: 'PAPER',
          }
        });
      } catch (e) {
        console.log('BotSettings creation skipped');
      }

      // Create notification settings
      try {
        await db.notificationSettings.create({
          data: {
            userId: admin.id,
          }
        });
      } catch (e) {
        console.log('NotificationSettings creation skipped');
      }

      // Seed plans
      try {
        const existingPlans = await db.plan.count();
        if (existingPlans === 0) {
          await db.plan.createMany({
            data: [
              {
                name: 'TRIAL',
                displayName: 'Free Trial',
                displayNameEn: 'Free Trial',
                description: 'Try all features free for 7 days',
                priceMonthly: 0,
                priceYearly: 0,
                maxTradesPerDay: 5,
                maxActiveTrades: 2,
                trialDays: 7,
                features: JSON.stringify(['basic_signals', 'telegram_notifications']),
                isPopular: false,
                sortOrder: 0,
              },
              {
                name: 'PRO',
                displayName: 'Pro',
                displayNameEn: 'Pro',
                description: 'For serious traders',
                priceMonthly: 79,
                priceYearly: 758,
                maxTradesPerDay: -1,
                maxActiveTrades: -1,
                trialDays: 0,
                features: JSON.stringify(['unlimited_trades', 'advanced_analytics', 'priority_support']),
                hasAIAnalysis: true,
                hasPaperTrading: true,
                hasTelegramNotif: true,
                isPopular: true,
                badgeText: 'الأكثر شعبية',
                sortOrder: 1,
              },
              {
                name: 'ENTERPRISE',
                displayName: 'Enterprise',
                displayNameEn: 'Enterprise',
                description: 'For professional teams',
                priceMonthly: 199,
                priceYearly: 1910,
                maxTradesPerDay: -1,
                maxActiveTrades: -1,
                trialDays: 0,
                features: JSON.stringify(['unlimited_everything', 'api_access']),
                hasAIAnalysis: true,
                hasPaperTrading: true,
                hasTelegramNotif: true,
                hasPrioritySupport: true,
                hasAPIAccess: true,
                sortOrder: 2,
              },
            ],
          });
        }
      } catch (e) {
        console.log('Plans seeding skipped');
      }

      return NextResponse.json({
        success: true,
        message: 'Admin account created successfully!',
        admin: {
          email: adminEmail,
          password: adminPassword
        }
      });

    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin',
        details: e.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to initialize admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminExists = await db.user.findFirst({
      where: { isAdmin: true },
      select: { email: true, createdAt: true }
    });

    return NextResponse.json({
      adminExists: !!adminExists,
      adminEmail: adminExists?.email || null,
      setupRequired: !adminExists
    });
  } catch (error) {
    return NextResponse.json({
      adminExists: false,
      error: 'Database not ready'
    });
  }
}
