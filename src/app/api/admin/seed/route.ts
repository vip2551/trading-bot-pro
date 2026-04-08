import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Check if plans exist and get count
export async function GET() {
  try {
    const count = await db.plan.count();
    return NextResponse.json({ 
      exists: count > 0,
      count 
    });
  } catch (error) {
    console.error('Error checking plans:', error);
    return NextResponse.json({ 
      exists: false, 
      count: 0,
      error: 'Database not available'
    });
  }
}

// POST - Seed default plans
export async function POST() {
  try {
    // Check if plans already exist
    const existingPlans = await db.plan.count();

    if (existingPlans > 0) {
      const plans = await db.plan.findMany({
        orderBy: { sortOrder: 'asc' }
      });
      return NextResponse.json({ 
        success: true,
        message: 'Plans already seeded', 
        count: existingPlans,
        plans 
      });
    }

    // Create default plans one by one to handle errors better
    const defaultPlans = [
      {
        name: 'TRIAL',
        displayName: 'Free Trial',
        displayNameEn: 'Free Trial',
        description: 'Try all features free for 7 days - تجربة مجانية لمدة 7 أيام',
        priceMonthly: 0,
        priceYearly: 0,
        maxTradesPerDay: 5,
        maxActiveTrades: 2,
        trialDays: 7,
        features: JSON.stringify(['basic_signals', 'telegram_notifications', 'simulation_mode']),
        featuresAr: JSON.stringify(['إشارات أساسية', 'إشعارات تيليجرام', 'وضع المحاكاة']),
        isPopular: false,
        sortOrder: 0,
        hasTelegramNotif: true,
      },
      {
        name: 'BASIC',
        displayName: 'Basic',
        displayNameEn: 'Basic',
        description: 'Perfect for getting started - مثالي للبدء',
        priceMonthly: 29,
        priceYearly: 278,
        originalPriceMonthly: 29,
        originalPriceYearly: 348,
        maxTradesPerDay: 20,
        maxActiveTrades: 5,
        trialDays: 0,
        features: JSON.stringify(['trailing_stop', 'bracket_orders', 'telegram_notifications', 'paper_trading']),
        featuresAr: JSON.stringify(['وقف متحرك', 'أوامر محيطية', 'إشعارات تيليجرام', 'تداول ورقي']),
        isPopular: false,
        sortOrder: 1,
        hasTelegramNotif: true,
        hasPaperTrading: true,
      },
      {
        name: 'PRO',
        displayName: 'Pro',
        displayNameEn: 'Pro',
        description: 'For serious traders - للمتداولين الجادين',
        priceMonthly: 79,
        priceYearly: 758,
        originalPriceMonthly: 79,
        originalPriceYearly: 948,
        maxTradesPerDay: -1,
        maxActiveTrades: 10,
        trialDays: 0,
        features: JSON.stringify(['unlimited_trades', 'advanced_analytics', 'priority_support', 'live_trading', 'ai_analysis', 'whale_tracker']),
        featuresAr: JSON.stringify(['صفقات غير محدودة', 'تحليلات متقدمة', 'دعم ذو أولوية', 'تداول حقيقي', 'تحليل الذكاء الاصطناعي', 'متتبع الحيتان']),
        isPopular: true,
        badgeText: 'الأكثر شعبية',
        badgeColor: 'green',
        sortOrder: 2,
        hasAIAnalysis: true,
        hasWhaleTracker: true,
        hasPaperTrading: true,
        hasAdvancedCharts: true,
        hasPrioritySupport: true,
        hasTelegramNotif: true,
      },
      {
        name: 'ENTERPRISE',
        displayName: 'Enterprise',
        displayNameEn: 'Enterprise',
        description: 'For professional teams - للفرق المحترفة',
        priceMonthly: 199,
        priceYearly: 1910,
        originalPriceMonthly: 199,
        originalPriceYearly: 2388,
        maxTradesPerDay: -1,
        maxActiveTrades: -1,
        trialDays: 0,
        features: JSON.stringify(['unlimited_everything', 'dedicated_support', 'custom_integrations', 'api_access', 'white_label', 'backtesting']),
        featuresAr: JSON.stringify(['كل شيء غير محدود', 'دعم مخصص', 'تكاملات مخصصة', 'وصول API', 'علامة تجارية خاصة', 'اختبار استراتيجيات']),
        isPopular: false,
        badgeText: 'الأفضل للفرق',
        badgeColor: 'purple',
        sortOrder: 3,
        hasAPIAccess: true,
        hasAIAnalysis: true,
        hasWhaleTracker: true,
        hasBacktesting: true,
        hasAdvancedCharts: true,
        hasPrioritySupport: true,
        hasPaperTrading: true,
        hasTelegramNotif: true,
      },
    ];

    let created = 0;
    const createdPlans = [];

    for (const planData of defaultPlans) {
      try {
        const plan = await db.plan.create({ data: planData });
        createdPlans.push(plan);
        created++;
      } catch (e) {
        console.error(`Failed to create plan ${planData.name}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} plans`,
      count: created,
      plans: createdPlans,
    });
  } catch (error) {
    console.error('Error seeding plans:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to seed plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
