import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch bot settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';

    // Try to get user-specific settings
    let settings = await db.botSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create user if not exists
      try {
        await db.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: `${userId}@demo.local`,
            name: userId,
          },
          update: {},
        });

        settings = await db.botSettings.create({
          data: { userId },
        });
      } catch (createError) {
        console.error('Error creating settings:', createError);
        // Return default settings even if DB fails
        return NextResponse.json({
          settings: getDefaultSettings(),
        });
      }
    }

    // Return all settings
    return NextResponse.json({
      settings: {
        isRunning: settings.isRunning,
        ibHost: settings.ibHost || '127.0.0.1',
        ibPort: settings.ibPort || 7497,
        ibClientId: settings.ibClientId || 1,
        strikeSelectionMode: settings.strikeSelectionMode || 'OFFSET',
        contractPriceMin: settings.contractPriceMin || 300,
        contractPriceMax: settings.contractPriceMax || 400,
        spxStrikeOffset: settings.spxStrikeOffset || 5,
        spxDeltaTarget: settings.spxDeltaTarget || 0.3,
        telegramEnabled: settings.telegramEnabled || false,
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || '',
        maxRiskPerTrade: settings.maxRiskPerTrade || 500,
        maxOpenPositions: settings.maxOpenPositions || 3,
        maxDailyLoss: settings.maxDailyLoss || 1000,
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings on error
    return NextResponse.json({
      settings: getDefaultSettings(),
    });
  }
}

// POST - Update bot settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...settingsData } = body;
    const uid = userId || 'demo';

    console.log('Saving settings for user:', uid, 'data:', settingsData);

    // Ensure user exists
    try {
      await db.user.upsert({
        where: { id: uid },
        create: {
          id: uid,
          email: `${uid}@demo.local`,
          name: uid,
        },
        update: {},
      });
    } catch (userError) {
      console.log('User upsert failed, continuing...', userError);
    }

    // Check if settings exist
    let settings = await db.botSettings.findUnique({
      where: { userId: uid },
    });

    if (!settings) {
      settings = await db.botSettings.create({
        data: { userId: uid, ...settingsData },
      });
    } else {
      settings = await db.botSettings.update({
        where: { userId: uid },
        data: settingsData,
      });
    }

    console.log('Settings saved successfully');

    return NextResponse.json({
      success: true,
      settings: {
        isRunning: settings.isRunning,
        ibHost: settings.ibHost,
        ibPort: settings.ibPort,
        ibClientId: settings.ibClientId,
        strikeSelectionMode: settings.strikeSelectionMode,
        contractPriceMin: settings.contractPriceMin,
        contractPriceMax: settings.contractPriceMax,
        spxStrikeOffset: settings.spxStrikeOffset,
        spxDeltaTarget: settings.spxDeltaTarget,
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
  };
}
