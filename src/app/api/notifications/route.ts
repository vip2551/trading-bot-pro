import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTestMessage, type Language } from '@/lib/telegram-templates';

// GET - Fetch notification settings
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

    let settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings && userId) {
      settings = await db.notificationSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({ 
      success: true,
      settings: settings || {
        telegramEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
        discordEnabled: false,
        discordWebhookUrl: '',
        emailEnabled: false,
        notificationLanguage: 'ar'
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ 
      success: true,
      settings: {
        telegramEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
        discordEnabled: false,
        discordWebhookUrl: '',
        emailEnabled: false,
        notificationLanguage: 'ar'
      }
    });
  }
}

// POST - Update notification settings
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

    console.log('Saving notification settings for user:', userId);

    const settings = await db.notificationSettings.upsert({
      where: { userId },
      update: settingsData,
      create: { userId, ...settingsData },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم حفظ الإعدادات بنجاح',
      settings 
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Test notification
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, type } = body;

    // If no userId or demo, find admin
    if (!userId || userId === 'demo') {
      const admin = await db.user.findFirst({
        where: { isAdmin: true }
      });
      if (admin) userId = admin.id;
    }

    const settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return NextResponse.json({ 
        success: false,
        error: 'Settings not found. Please save settings first.' 
      }, { status: 404 });
    }

    const lang: Language = (settings.notificationLanguage as Language) || 'ar';
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
      message: success ? 'تم إرسال رسالة الاختبار!' : 'فشل إرسال الرسالة',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test' 
    }, { status: 500 });
  }
}
