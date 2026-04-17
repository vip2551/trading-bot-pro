import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch bot settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // If no userId or demo, find admin
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) userId = admin.id;
    }

    let settings = await db.botSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      if (userId) {
        settings = await db.botSettings.create({
          data: { userId, accountType: 'PAPER' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        isRunning: settings?.isRunning || false,
        accountType: settings?.accountType || 'PAPER',
        ibHost: settings?.ibHost || '127.0.0.1',
        ibPort: settings?.ibPort || 7497,
        ibClientId: settings?.ibClientId || 1,
        ibConnected: settings?.ibConnected || false,
        strikeSelectionMode: settings?.strikeSelectionMode || 'OFFSET',
        contractPriceMin: settings?.contractPriceMin || 300,
        contractPriceMax: settings?.contractPriceMax || 400,
        spxStrikeOffset: settings?.spxStrikeOffset || 5,
        spxDeltaTarget: settings?.spxDeltaTarget || 0.3,
        telegramEnabled: settings?.telegramEnabled || false,
        telegramBotToken: settings?.telegramBotToken || '',
        telegramChatId: settings?.telegramChatId || '',
        maxRiskPerTrade: settings?.maxRiskPerTrade || 500,
        maxOpenPositions: settings?.maxOpenPositions || 3,
        maxDailyLoss: settings?.maxDailyLoss || 1000,
        defaultQuantity: settings?.defaultQuantity || 1,
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: true,
      settings: getDefaultSettings(),
    });
  }
}

// POST - Update bot settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, ...settingsData } = body;

    // If no userId or demo, find admin
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) userId = admin.id;
    }

    console.log('Saving settings for user:', userId);

    let settings = await db.botSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.botSettings.create({
        data: { userId, ...settingsData },
      });
    } else {
      settings = await db.botSettings.update({
        where: { userId },
        data: settingsData,
      });
    }

    console.log('Settings saved successfully');

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      settings: {
        isRunning: settings.isRunning,
        accountType: settings.accountType,
        ibHost: settings.ibHost,
        ibPort: settings.ibPort,
        telegramEnabled: settings.telegramEnabled,
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || '',
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getDefaultSettings() {
  return {
    isRunning: false,
    accountType: 'PAPER',
    ibHost: '127.0.0.1',
    ibPort: 7497,
    ibClientId: 1,
    strikeSelectionMode: 'OFFSET',
    contractPriceMin: 300,
    contractPriceMax: 400,
    spxStrikeOffset: 5,
    spxDeltaTarget: 0.3,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    maxRiskPerTrade: 500,
    maxOpenPositions: 3,
    maxDailyLoss: 1000,
    defaultQuantity: 1,
  };
}
