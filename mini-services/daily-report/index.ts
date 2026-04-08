import { serve } from "bun";
import ZAI from 'z-ai-web-dev-sdk';

// Market close time (4:00 PM ET = 11:00 PM Mecca time)
const REPORT_TIME_HOUR = 23; // 11 PM Asia/Riyadh
const REPORT_TIME_MINUTE = 0;
const CHECK_INTERVAL = 60000; // 1 minute

let zaiInstance: any = null;
let lastReportDate = '';

// Initialize ZAI
async function initZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Get bot settings
async function getBotSettings(): Promise<any> {
  try {
    const res = await fetch('http://localhost:3000/api/settings');
    const data = await res.json();
    return data.settings;
  } catch (e) {
    console.error('Error getting settings:', e);
    return null;
  }
}

// Get today's trades
async function getTodayTrades(): Promise<any[]> {
  try {
    const res = await fetch('http://localhost:3000/api/trades');
    const data = await res.json();
    const trades = data.trades || [];
    
    // Filter today's trades
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return trades.filter((t: any) => {
      const tradeDate = new Date(t.createdAt);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });
  } catch (e) {
    console.error('Error getting trades:', e);
    return [];
  }
}

// Calculate report statistics
function calculateStats(trades: any[]) {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const openTrades = trades.filter(t => t.status === 'OPEN');
  
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0).length;
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0).map(t => t.pnl || 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0).map(t => t.pnl || 0);
  
  const totalWins = wins.reduce((a, b) => a + b, 0);
  const totalLosses = losses.reduce((a, b) => a + b, 0);
  
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  
  const bestTrade = wins.length > 0 ? Math.max(...wins) : 0;
  const worstTrade = losses.length > 0 ? Math.min(...losses) : 0;
  
  return {
    totalTrades,
    openTrades: openTrades.length,
    winningTrades,
    losingTrades,
    winRate,
    totalPnL,
    totalWins,
    totalLosses,
    avgWin,
    avgLoss,
    bestTrade,
    worstTrade,
    trades: closedTrades
  };
}

// Generate professional dashboard image
async function generateDashboardImage(stats: any, trades: any[], lang: 'en' | 'ar' = 'ar'): Promise<Buffer> {
  const zai = await initZAI();
  
  const isProfit = stats.totalPnL >= 0;
  const profitColor = isProfit ? 'green' : 'red';
  const today = new Date();
  const dateStr = today.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build detailed prompt for dashboard-style image
  const prompt = `Create a professional dark-themed financial trading dashboard image with the following layout:

TOP SECTION:
- Title: "${lang === 'ar' ? '📊 تقرير التداول اليومي' : '📊 Daily Trading Report'}"
- Date: "${dateStr}"
- Telegram bot icon with handle

STATS ROW (4 colored boxes):
- Purple box: "${lang === 'ar' ? 'نسبة الفوز' : 'Win Rate'}" = ${stats.winRate.toFixed(0)}%
- Red box: "${lang === 'ar' ? 'صفقات خاسرة' : 'Losing Trades'}" = ${stats.losingTrades}
- Green box: "${lang === 'ar' ? 'صفقات رابحة' : 'Winning Trades'}" = ${stats.winningTrades}
- Blue box: "${lang === 'ar' ? 'إجمالي الصفقات' : 'Total Trades'}" = ${stats.totalTrades}

TRADES TABLE:
Columns: # | Symbol | Strike | Type | Entry | Exit | P&L
${trades.slice(0, 5).map((t, i) => 
  `${i + 1} | ${t.symbol || 'SPX'} | ${(t.strike || 0).toFixed(0)} | ${t.direction || t.optionType || 'CALL'} | $${(t.entryPrice || 0).toFixed(2)} | $${(t.exitPrice || 0).toFixed(2)} | ${((t.pnl || 0) >= 0 ? '+' : '')}$${(t.pnl || 0).toFixed(2)}`
).join('\n')}

BOTTOM SECTION:
- Red button: "${lang === 'ar' ? 'إجمالي الخسائر' : 'Total Losses'}" = $${Math.abs(stats.totalLosses).toFixed(2)}
- Green button: "${lang === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}" = $${stats.totalWins.toFixed(2)}
- Large ${profitColor} button: "${lang === 'ar' ? 'صافي الربح/الخسارة' : 'Net P&L'}" = ${isProfit ? '+' : ''}$${stats.totalPnL.toFixed(2)}

Style requirements:
- Dark background (#1a1a2e or similar)
- Professional fintech aesthetic
- Neon accents for ${profitColor} highlights
- Clean modern typography
- High contrast for readability
- Dashboard card layout with rounded corners
- Glowing effects on key metrics
- Professional trading platform style`;

  const response = await zai.images.generations.create({
    prompt: prompt,
    size: '1024x1024'
  });

  const imageBase64 = response.data[0].base64;
  return Buffer.from(imageBase64, 'base64');
}

// Send photo to Telegram
async function sendTelegramPhoto(imageBuffer: Buffer, caption: string, settings: any): Promise<boolean> {
  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    console.error('Telegram settings not configured');
    return false;
  }

  try {
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('chat_id', settings.telegramChatId);
    formData.append('photo', blob, 'daily_report.png');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendPhoto`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    
    if (data.ok) {
      console.log('✅ Daily report photo sent successfully');
      return true;
    } else {
      console.error('Telegram error:', data.description);
      return false;
    }
  } catch (e) {
    console.error('Error sending photo:', e);
    return false;
  }
}

// Send text report to Telegram
async function sendTelegramText(message: string, settings: any): Promise<boolean> {
  if (!settings?.telegramBotToken || !settings?.telegramChatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.error('Error sending message:', e);
    return false;
  }
}

// Generate and send daily report
async function sendDailyReport(): Promise<void> {
  const today = new Date().toDateString();
  
  // Don't send twice in the same day
  if (lastReportDate === today) {
    return;
  }

  console.log('📊 Generating daily report...');
  
  const settings = await getBotSettings();
  if (!settings?.telegramEnabled) {
    console.log('Telegram notifications disabled');
    return;
  }

  const trades = await getTodayTrades();
  const stats = calculateStats(trades);
  
  // Skip if no trades
  if (stats.totalTrades === 0 && stats.openTrades === 0) {
    console.log('No trades today, skipping report');
    return;
  }

  const lang = settings.notificationLanguage || 'ar';
  const isProfit = stats.totalPnL >= 0;
  const pnlEmoji = isProfit ? '🟢' : '🔴';
  const resultEmoji = isProfit ? '🎉' : '💪';
  const todayDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Build professional caption matching the image style
  let caption = '';
  if (lang === 'ar') {
    caption = `📊 *تقرير التداول اليومي*
📅 ${todayDate}
🤖 @{${settings.telegramBotToken?.split(':')[0] || 'TradingBot'}}

━━━━━━━━━━━━━━━
📈 *إحصائيات اليوم:*

🟣 *نسبة الفوز:* ${stats.winRate.toFixed(0)}%
🔴 *صفقات خاسرة:* ${stats.losingTrades}
🟢 *صفقات رابحة:* ${stats.winningTrades}
🔵 *إجمالي الصفقات:* ${stats.totalTrades}

━━━━━━━━━━━━━━━
📋 *تفاصيل الصفقات:*

${stats.trades.slice(0, 5).map((t: any, i: number) => {
  const dir = t.direction || t.optionType || 'N/A';
  const dirEmoji = dir === 'CALL' ? '📈' : '📉';
  const pnl = t.pnl || 0;
  const pnlEm = pnl >= 0 ? '✅' : '❌';
  const strike = t.strike ? `${t.strike.toFixed(0)}` : 'N/A';
  return `${i + 1}. ${dirEmoji} *${t.symbol || 'SPX'}* ${strike}\n   📌 ${dir} | 💰 $${(t.entryPrice || 0).toFixed(2)} → $${(t.exitPrice || 0).toFixed(2)}\n   ${pnlEm} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━
💵 *ملخص الأداء:*

❌ إجمالي الخسائر: $${Math.abs(stats.totalLosses).toFixed(2)}
✅ إجمالي الأرباح: $${stats.totalWins.toFixed(2)}

${pnlEmoji} *صافي الربح/الخسارة: ${isProfit ? '+' : ''}$${stats.totalPnL.toFixed(2)}*

━━━━━━━━━━━━━━━
${resultEmoji} ${isProfit ? '*يوم رائع! استمر في العمل الجيد!*' : '*غداً يوم أفضل! حافظ على تركيزك.*'}

🤖 _بوت التداول الاحترافي_`;
  } else {
    caption = `📊 *Daily Trading Report*
📅 ${todayDate}
🤖 @{${settings.telegramBotToken?.split(':')[0] || 'TradingBot'}}

━━━━━━━━━━━━━━━
📈 *Today's Statistics:*

🟣 *Win Rate:* ${stats.winRate.toFixed(0)}%
🔴 *Losing Trades:* ${stats.losingTrades}
🟢 *Winning Trades:* ${stats.winningTrades}
🔵 *Total Trades:* ${stats.totalTrades}

━━━━━━━━━━━━━━━
📋 *Trade Details:*

${stats.trades.slice(0, 5).map((t: any, i: number) => {
  const dir = t.direction || t.optionType || 'N/A';
  const dirEmoji = dir === 'CALL' ? '📈' : '📉';
  const pnl = t.pnl || 0;
  const pnlEm = pnl >= 0 ? '✅' : '❌';
  const strike = t.strike ? `${t.strike.toFixed(0)}` : 'N/A';
  return `${i + 1}. ${dirEmoji} *${t.symbol || 'SPX'}* ${strike}\n   📌 ${dir} | 💰 $${(t.entryPrice || 0).toFixed(2)} → $${(t.exitPrice || 0).toFixed(2)}\n   ${pnlEm} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━
💵 *Performance Summary:*

❌ Total Losses: $${Math.abs(stats.totalLosses).toFixed(2)}
✅ Total Profits: $${stats.totalWins.toFixed(2)}

${pnlEmoji} *Net P&L: ${isProfit ? '+' : ''}$${stats.totalPnL.toFixed(2)}*

━━━━━━━━━━━━━━━
${resultEmoji} ${isProfit ? '*Great day! Keep up the good work!*' : '*Tomorrow is a new day! Stay focused.*'}

🤖 _Trading Bot Pro_`;
  }

  try {
    // Generate dashboard image
    console.log('🖼️ Generating dashboard image...');
    const imageBuffer = await generateDashboardImage(stats, stats.trades, lang);
    
    // Send photo with caption
    const sent = await sendTelegramPhoto(imageBuffer, caption, settings);
    
    if (!sent) {
      // Fallback to text only
      console.log('📤 Sending text-only report...');
      await sendTelegramText(caption, settings);
    }
    
    lastReportDate = today;
    console.log('✅ Daily report sent successfully');
  } catch (e) {
    console.error('Error generating report:', e);
    // Fallback to text only
    await sendTelegramText(caption, settings);
    lastReportDate = today;
  }
}

// Check if it's time to send report
function shouldSendReport(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  return hours === REPORT_TIME_HOUR && minutes === REPORT_TIME_MINUTE;
}

// Manual trigger endpoint
async function triggerReportManually(): Promise<{ success: boolean; message: string }> {
  try {
    lastReportDate = '';
    await sendDailyReport();
    return { success: true, message: 'Daily report sent successfully' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// Main loop
console.log('📊 Daily Report Service Started');
console.log(`⏰ Report will be sent at ${REPORT_TIME_HOUR}:${REPORT_TIME_MINUTE.toString().padStart(2, '0')} (Asia/Riyadh)`);

setInterval(async () => {
  if (shouldSendReport()) {
    await sendDailyReport();
  }
}, CHECK_INTERVAL);

// HTTP Server
serve({
  port: 3005,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/health') {
        return Response.json({
          status: 'ok',
          lastReportDate,
          scheduledTime: `${REPORT_TIME_HOUR}:${REPORT_TIME_MINUTE}`,
          timestamp: new Date().toISOString()
        }, { headers: corsHeaders });
      }

      if (path === '/trigger' && req.method === 'POST') {
        const result = await triggerReportManually();
        return Response.json(result, { headers: corsHeaders });
      }

      if (path === '/preview' && req.method === 'GET') {
        const settings = await getBotSettings();
        const trades = await getTodayTrades();
        const stats = calculateStats(trades);
        return Response.json({
          stats,
          trades: stats.trades,
          willSendAt: `${REPORT_TIME_HOUR}:${REPORT_TIME_MINUTE}`
        }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  },
});

console.log('✅ Daily Report Service running on port 3005');
