import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const plans = await db.plan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    // Transform features from JSON string
    const transformedPlans = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      featuresAr: plan.featuresAr ? JSON.parse(plan.featuresAr) : [],
      subscriberCount: plan._count.subscriptions
    }));

    return NextResponse.json({ plans: transformedPlans });

  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json({ plans: [] });
  }
}

// POST - Create or update plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      displayName,
      displayNameEn,
      description,
      priceMonthly,
      priceYearly,
      originalPriceMonthly,
      originalPriceYearly,
      discountPercent,
      discountEnabled,
      discountLabel,
      maxTradesPerDay,
      maxActiveTrades,
      trialDays,
      features,
      featuresAr,
      hasAIAnalysis,
      hasWhaleTracker,
      hasAdvancedCharts,
      hasPaperTrading,
      hasBacktesting,
      hasTelegramNotif,
      hasPrioritySupport,
      hasAPIAccess,
      isPopular,
      isActive,
      sortOrder,
      badgeText,
      badgeColor,
    } = body;

    if (id) {
      // Update existing plan
      const plan = await db.plan.update({
        where: { id },
        data: {
          displayName,
          displayNameEn,
          description,
          priceMonthly,
          priceYearly,
          originalPriceMonthly,
          originalPriceYearly,
          discountPercent,
          discountEnabled,
          discountLabel,
          maxTradesPerDay,
          maxActiveTrades,
          trialDays,
          features: features ? JSON.stringify(features) : null,
          featuresAr: featuresAr ? JSON.stringify(featuresAr) : null,
          hasAIAnalysis,
          hasWhaleTracker,
          hasAdvancedCharts,
          hasPaperTrading,
          hasBacktesting,
          hasTelegramNotif,
          hasPrioritySupport,
          hasAPIAccess,
          isPopular,
          isActive,
          sortOrder,
          badgeText,
          badgeColor,
        }
      });

      return NextResponse.json({ success: true, plan });
    } else {
      // Create new plan
      const plan = await db.plan.create({
        data: {
          name,
          displayName,
          displayNameEn,
          description,
          priceMonthly: priceMonthly || 0,
          priceYearly: priceYearly || 0,
          originalPriceMonthly,
          originalPriceYearly,
          discountPercent,
          discountEnabled: discountEnabled || false,
          discountLabel,
          maxTradesPerDay: maxTradesPerDay || 5,
          maxActiveTrades: maxActiveTrades || 2,
          trialDays: trialDays || 0,
          features: features ? JSON.stringify(features) : null,
          featuresAr: featuresAr ? JSON.stringify(featuresAr) : null,
          hasAIAnalysis: hasAIAnalysis || false,
          hasWhaleTracker: hasWhaleTracker || false,
          hasAdvancedCharts: hasAdvancedCharts || false,
          hasPaperTrading: hasPaperTrading || false,
          hasBacktesting: hasBacktesting || false,
          hasTelegramNotif: hasTelegramNotif !== false,
          hasPrioritySupport: hasPrioritySupport || false,
          hasAPIAccess: hasAPIAccess || false,
          isPopular: isPopular || false,
          isActive: isActive !== false,
          sortOrder: sortOrder || 0,
          badgeText,
          badgeColor,
        }
      });

      return NextResponse.json({ success: true, plan });
    }

  } catch (error) {
    console.error('Save plan error:', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Check if plan has subscribers
    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } }
    });

    if (plan && plan._count.subscriptions > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active subscribers' 
      }, { status: 400 });
    }

    await db.plan.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}

// PUT - Initialize default plans
export async function PUT() {
  try {
    const defaultPlans = [
      {
        name: 'TRIAL',
        displayName: 'تجريبي مجاني',
        displayNameEn: 'Free Trial',
        description: 'تجربة مجانية لمدة 7 أيام',
        priceMonthly: 0,
        priceYearly: 0,
        maxTradesPerDay: 5,
        maxActiveTrades: 2,
        trialDays: 7,
        features: ['5 صفقات يومياً', 'صفقتان نشطتان', 'إشعارات تيليجرام', 'دعم فني بالبريد'],
        featuresAr: ['5 صفقات يومياً', 'صفقتان نشطتان', 'إشعارات تيليجرام', 'دعم فني بالبريد'],
        hasTelegramNotif: true,
        isPopular: false,
        sortOrder: 1,
        badgeText: 'مجاني',
        badgeColor: 'blue',
      },
      {
        name: 'BASIC',
        displayName: 'الأساسية',
        displayNameEn: 'Basic',
        description: 'للمتداولين المبتدئين',
        priceMonthly: 29,
        priceYearly: 290,
        maxTradesPerDay: 10,
        maxActiveTrades: 3,
        trialDays: 0,
        features: ['10 صفقات يومياً', '3 صفقات نشطة', 'إشعارات تيليجرام', 'تحديثات السعر كل دقيقة', 'دعم فني'],
        featuresAr: ['10 صفقات يومياً', '3 صفقات نشطة', 'إشعارات تيليجرام', 'تحديثات السعر كل دقيقة', 'دعم فني'],
        hasTelegramNotif: true,
        hasAdvancedCharts: true,
        isPopular: false,
        sortOrder: 2,
        badgeText: null,
        badgeColor: null,
      },
      {
        name: 'PRO',
        displayName: 'المحترف',
        displayNameEn: 'Pro',
        description: 'للمتداولين المحترفين',
        priceMonthly: 79,
        priceYearly: 790,
        maxTradesPerDay: -1,
        maxActiveTrades: 5,
        trialDays: 0,
        features: ['صفقات غير محدودة', '5 صفقات نشطة', 'إشعارات تيليجرام', 'تحديثات السعر', 'تتبع الحيتان', 'تحليل AI', 'دعم أولوية 24/7'],
        featuresAr: ['صفقات غير محدودة', '5 صفقات نشطة', 'إشعارات تيليجرام', 'تحديثات السعر', 'تتبع الحيتان', 'تحليل AI', 'دعم أولوية 24/7'],
        hasTelegramNotif: true,
        hasAdvancedCharts: true,
        hasWhaleTracker: true,
        hasAIAnalysis: true,
        hasBacktesting: true,
        hasPrioritySupport: true,
        isPopular: true,
        sortOrder: 3,
        badgeText: 'الأكثر شعبية',
        badgeColor: 'green',
      },
      {
        name: 'ENTERPRISE',
        displayName: 'المؤسسات',
        displayNameEn: 'Enterprise',
        description: 'للفرق والمؤسسات',
        priceMonthly: 199,
        priceYearly: 1990,
        maxTradesPerDay: -1,
        maxActiveTrades: -1,
        trialDays: 0,
        features: ['صفقات غير محدودة', 'صفقات نشطة غير محدودة', 'API كامل', 'تقارير متقدمة', 'مدير حساب خاص', 'تدريب مخصص', 'SLA مضمون'],
        featuresAr: ['صفقات غير محدودة', 'صفقات نشطة غير محدودة', 'API كامل', 'تقارير متقدمة', 'مدير حساب خاص', 'تدريب مخصص', 'SLA مضمون'],
        hasTelegramNotif: true,
        hasAdvancedCharts: true,
        hasWhaleTracker: true,
        hasAIAnalysis: true,
        hasBacktesting: true,
        hasPaperTrading: true,
        hasPrioritySupport: true,
        hasAPIAccess: true,
        isPopular: false,
        sortOrder: 4,
        badgeText: 'للمؤسسات',
        badgeColor: 'purple',
      }
    ];

    for (const planData of defaultPlans) {
      await db.plan.upsert({
        where: { name: planData.name },
        create: {
          name: planData.name,
          displayName: planData.displayName,
          displayNameEn: planData.displayNameEn,
          description: planData.description,
          priceMonthly: planData.priceMonthly,
          priceYearly: planData.priceYearly,
          maxTradesPerDay: planData.maxTradesPerDay,
          maxActiveTrades: planData.maxActiveTrades,
          trialDays: planData.trialDays,
          features: JSON.stringify(planData.features),
          featuresAr: JSON.stringify(planData.featuresAr),
          hasTelegramNotif: planData.hasTelegramNotif,
          hasAdvancedCharts: planData.hasAdvancedCharts || false,
          hasWhaleTracker: planData.hasWhaleTracker || false,
          hasAIAnalysis: planData.hasAIAnalysis || false,
          hasBacktesting: planData.hasBacktesting || false,
          hasPaperTrading: planData.hasPaperTrading || false,
          hasPrioritySupport: planData.hasPrioritySupport || false,
          hasAPIAccess: planData.hasAPIAccess || false,
          isPopular: planData.isPopular,
          isActive: true,
          sortOrder: planData.sortOrder,
          badgeText: planData.badgeText,
          badgeColor: planData.badgeColor,
        },
        update: {
          displayName: planData.displayName,
          displayNameEn: planData.displayNameEn,
          description: planData.description,
          priceMonthly: planData.priceMonthly,
          priceYearly: planData.priceYearly,
          maxTradesPerDay: planData.maxTradesPerDay,
          maxActiveTrades: planData.maxActiveTrades,
          trialDays: planData.trialDays,
          features: JSON.stringify(planData.features),
          featuresAr: JSON.stringify(planData.featuresAr),
          hasTelegramNotif: planData.hasTelegramNotif,
          hasAdvancedCharts: planData.hasAdvancedCharts || false,
          hasWhaleTracker: planData.hasWhaleTracker || false,
          hasAIAnalysis: planData.hasAIAnalysis || false,
          hasBacktesting: planData.hasBacktesting || false,
          hasPaperTrading: planData.hasPaperTrading || false,
          hasPrioritySupport: planData.hasPrioritySupport || false,
          hasAPIAccess: planData.hasAPIAccess || false,
          isPopular: planData.isPopular,
          sortOrder: planData.sortOrder,
          badgeText: planData.badgeText,
          badgeColor: planData.badgeColor,
        }
      });
    }

    const plans = await db.plan.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم إنشاء الباقات الافتراضية',
      plans 
    });

  } catch (error) {
    console.error('Init plans error:', error);
    return NextResponse.json({ error: 'Failed to initialize plans' }, { status: 500 });
  }
}
