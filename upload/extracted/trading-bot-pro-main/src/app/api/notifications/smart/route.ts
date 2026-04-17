import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getDailyReportMessage,
  getStopLossAlertMessage,
  getTakeProfitAlertMessage,
  getDailyLimitMessage,
  getErrorMessage,
  type Language
} from '@/lib/telegram-templates';

/**
 * Smart Notifications API
 * نظام الإشعارات الذكية
 */

// GET - Get notification settings and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get notification settings
    const settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    // Get recent trade notifications
    const recentNotifications = await db.tradeNotification.findMany({
      where: {
        trade: { userId },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      settings,
      recentNotifications,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      tradeId,
      priority = 'NORMAL',
      // For specific notification types
      tradeInfo,
      distancePercent,
      dailyLoss,
      dailyLimit,
      errorDetails,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get notification settings
    const settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    const lang: Language = (settings?.notificationLanguage as Language) || 'en';
    let telegramMessage = '';

    // Generate appropriate message based on type
    switch (type) {
      case 'DAILY_REPORT':
        if (tradeInfo) {
          telegramMessage = getDailyReportMessage(tradeInfo, lang);
        }
        break;

      case 'STOP_LOSS_ALERT':
        if (tradeInfo && distancePercent !== undefined) {
          telegramMessage = getStopLossAlertMessage(tradeInfo, distancePercent, lang);
        }
        break;

      case 'TAKE_PROFIT_ALERT':
        if (tradeInfo && distancePercent !== undefined) {
          telegramMessage = getTakeProfitAlertMessage(tradeInfo, distancePercent, lang);
        }
        break;

      case 'DAILY_LIMIT':
        if (dailyLoss !== undefined && dailyLimit !== undefined) {
          telegramMessage = getDailyLimitMessage(dailyLoss, dailyLimit, lang);
        }
        break;

      case 'ERROR':
        telegramMessage = getErrorMessage(title || 'System Error', errorDetails || message || '', lang);
        break;

      default:
        // Generic notification
        const emoji = getPriorityEmoji(priority);
        telegramMessage = `${emoji} *${title || 'Notification'}*\n\n${message}`;
    }

    const results: { telegram?: boolean } = {};

    // Send Telegram notification
    if (settings?.telegramEnabled && settings.telegramBotToken && settings.telegramChatId && telegramMessage) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: telegramMessage,
            parse_mode: 'Markdown',
          }),
        });

        results.telegram = res.ok;
      } catch (e) {
        console.error('Telegram notification failed:', e);
        results.telegram = false;
      }
    }

    // Store notification in database
    if (tradeId) {
      await db.tradeNotification.create({
        data: {
          tradeId,
          type: type || 'PUSH',
          message: telegramMessage || `${title}: ${message}`,
          status: results.telegram ? 'SENT' : 'FAILED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Notification sent',
      lang,
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// Helper function to get priority emoji
function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'HIGH': return '🚨';
    case 'WARNING': return '⚠️';
    case 'SUCCESS': return '✅';
    case 'INFO': return 'ℹ️';
    default: return '📢';
  }
}

// Send daily report helper
export async function sendDailyReport(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trades = await db.trade.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
    const totalPnL = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const winRate = closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0;
    const bestTrade = Math.max(...closedTrades.map(t => t.pnl || 0), 0);
    const worstTrade = Math.min(...closedTrades.map(t => t.pnl || 0), 0);

    const settings = await db.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings?.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
      return { success: false, reason: 'Telegram not configured' };
    }

    const lang: Language = (settings.notificationLanguage as Language) || 'en';

    const reportData = {
      totalTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      totalPnL,
      winRate,
      bestTrade,
      worstTrade,
    };

    const message = getDailyReportMessage(reportData, lang);

    await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending daily report:', error);
    return { success: false, error };
  }
}
