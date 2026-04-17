import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getTradeOpenedMessage,
  getTradeClosedMessage,
  getTradeUpdatedMessage,
  getTestMessage,
  type Language
} from '@/lib/telegram-templates';

// POST - Send trade notification via Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tradeId, status, fillPrice, updateType } = body;

    // Get notification settings to get the language
    const notifSettings = await db.notificationSettings.findFirst();
    const lang: Language = (notifSettings?.notificationLanguage as Language) || 'en';

    // Also check bot settings for legacy telegram settings
    const settings = await db.botSettings.findFirst();

    const telegramBotToken = notifSettings?.telegramBotToken || settings?.telegramBotToken;
    const telegramChatId = notifSettings?.telegramChatId || settings?.telegramChatId;
    const telegramEnabled = notifSettings?.telegramEnabled;

    if (!telegramEnabled || !telegramBotToken || !telegramChatId) {
      return NextResponse.json({ message: 'Telegram notifications disabled' });
    }

    const trade = await db.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Prepare trade info for message templates
    const tradeInfo = {
      symbol: trade.symbol,
      direction: trade.direction,
      quantity: trade.quantity,
      strike: trade.strike,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      pnlPercent: trade.pnlPercent,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      delta: trade.delta,
      expiry: trade.expiry,
      spread: trade.spreadPercent,
      volume: trade.volumeAtExecution,
      slippage: trade.slippage,
    };

    // Determine notification type and get appropriate message
    let message: string;
    let notificationType = 'UPDATED';

    if (status === 'Filled') {
      notificationType = 'OPENED';
      // For fill notifications, use fillPrice if provided
      tradeInfo.entryPrice = fillPrice || trade.entryPrice;
      message = getTradeOpenedMessage(tradeInfo, lang);
    } else if (status === 'Cancelled' || status === 'CLOSED') {
      notificationType = 'CLOSED';
      tradeInfo.exitPrice = fillPrice || trade.exitPrice;
      message = getTradeClosedMessage(tradeInfo, lang);
    } else if (updateType) {
      notificationType = updateType;
      message = getTradeUpdatedMessage(tradeInfo, updateType, lang);
    } else {
      // Default: trade opened
      notificationType = 'OPENED';
      message = getTradeOpenedMessage(tradeInfo, lang);
    }

    // Send to Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    // Save notification
    await db.tradeNotification.create({
      data: {
        tradeId,
        type: notificationType,
        message,
        status: response.ok ? 'SENT' : 'FAILED',
      },
    });

    return NextResponse.json({ success: response.ok, message });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// PATCH - Send test notification
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Get notification settings
    const notifSettings = await db.notificationSettings.findFirst();
    const settings = await db.botSettings.findFirst();

    const telegramBotToken = notifSettings?.telegramBotToken || settings?.telegramBotToken;
    const telegramChatId = notifSettings?.telegramChatId || settings?.telegramChatId;
    const telegramEnabled = notifSettings?.telegramEnabled;
    const lang: Language = (notifSettings?.notificationLanguage as Language) || 'en';

    if (!telegramEnabled || !telegramBotToken || !telegramChatId) {
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 400 });
    }

    const message = getTestMessage(lang);

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Test message sent!' : 'Failed to send',
      lang
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: 'Failed to send test' }, { status: 500 });
  }
}
