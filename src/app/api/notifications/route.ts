import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTestMessage, type Language } from '@/lib/telegram-templates';

// Helper function to ensure user exists
async function ensureUserExists(userId: string) {
  let user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await db.user.create({
      data: {
        id: userId,
        email: `${userId}@demo.local`,
        name: userId,
      },
    });
  }
  return user;
}

// GET - Fetch notification settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Ensure user exists first
    await ensureUserExists(userId);

    let settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST - Update notification settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...settingsData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Ensure user exists first
    await ensureUserExists(userId);

    const settings = await db.notificationSettings.upsert({
      where: { userId },
      update: settingsData,
      create: { userId, ...settingsData },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// PATCH - Test notification
export async function PATCH(request: NextRequest) {
  try {
    const { userId, type } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const lang: Language = (settings.notificationLanguage as Language) || 'en';
    const testMessage = getTestMessage(lang);
    let success = false;

    if (type === 'telegram' && settings.telegramBotToken && settings.telegramChatId) {
      const res = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: testMessage,
          parse_mode: 'Markdown',
        }),
      });
      success = res.ok;
    } else if (type === 'discord' && settings.discordWebhookUrl) {
      const res = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testMessage,
        }),
      });
      success = res.ok;
    }

    return NextResponse.json({
      success,
      message: success ? 'Test sent!' : 'Failed to send',
      lang
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: 'Failed to send test' }, { status: 500 });
  }
}
