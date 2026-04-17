import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      return NextResponse.json({ 
        hasSubscription: false,
        message: 'لا يوجد اشتراك'
      });
    }

    // Check if subscription is active
    const isActive = subscription.status === 'ACTIVE' &&
      (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date());

    // Check trial
    const isTrialActive = subscription.isTrial &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) > new Date();

    // Calculate days remaining
    let daysRemaining = 0;
    if (subscription.currentPeriodEnd) {
      const diff = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        plan: subscription.plan,
        status: subscription.status,
        isActive,
        isTrial: subscription.isTrial,
        isTrialActive,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining,
        maxTradesPerDay: subscription.maxTradesPerDay,
        maxActiveTrades: subscription.maxActiveTrades,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات الاشتراك' }, { status: 500 });
  }
}

// POST - Subscribe to plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, billingPeriod } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: 'userId and planId required' }, { status: 400 });
    }

    // Get plan
    const plan = await db.plan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'الباقة غير موجودة أو غير متاحة' }, { status: 400 });
    }

    // Calculate period
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create or update subscription
    const subscription = await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        planName: plan.name,
        status: 'ACTIVE',
        isTrial: false,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxTradesPerDay: plan.maxTradesPerDay,
        maxActiveTrades: plan.maxActiveTrades
      },
      update: {
        planId: plan.id,
        planName: plan.name,
        status: 'ACTIVE',
        isTrial: false,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxTradesPerDay: plan.maxTradesPerDay,
        maxActiveTrades: plan.maxActiveTrades,
        cancelAtPeriodEnd: false
      },
      include: { plan: true }
    });

    // Create payment record (demo)
    const amount = billingPeriod === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
    
    if (amount > 0) {
      await db.payment.create({
        data: {
          userId,
          amount,
          currency: plan.currency,
          status: 'COMPLETED',
          planName: plan.name,
          billingPeriod: billingPeriod || 'MONTHLY'
        }
      });
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: `تم الاشتراك في باقة ${plan.displayName} بنجاح!`
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'فشل الاشتراك' }, { status: 500 });
  }
}

// PUT - Cancel subscription
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (action === 'cancel') {
      await db.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true }
      });

      return NextResponse.json({
        success: true,
        message: 'سيتم إلغاء الاشتراك في نهاية الفترة الحالية'
      });
    }

    if (action === 'reactivate') {
      await db.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: false }
      });

      return NextResponse.json({
        success: true,
        message: 'تم إعادة تفعيل الاشتراك'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Subscription action error:', error);
    return NextResponse.json({ error: 'فشل العملية' }, { status: 500 });
  }
}
