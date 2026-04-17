// Telegram Message Templates - Supports English and Arabic

export type Language = 'en' | 'ar';

interface TradeInfo {
  symbol: string;
  direction: string;
  quantity: number;
  strike?: number | null;
  entryPrice?: number | null;
  exitPrice?: number | null;
  pnl?: number | null;
  pnlPercent?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  delta?: number | null;
  expiry?: string | null;
  spread?: number | null;
  volume?: number | null;
  slippage?: number | null;
}

interface AlertInfo {
  symbol: string;
  targetType: string;
  targetValue: number;
  condition: string;
  currentPrice?: number;
  customMessage?: string;
}

interface DailyReportInfo {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}

// Format helpers
const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined) return '-';
  return num.toFixed(decimals);
};

const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  const prefix = amount >= 0 ? '+' : '';
  return `${prefix}$${amount.toFixed(2)}`;
};

const formatPercent = (percent: number | null | undefined): string => {
  if (percent === null || percent === undefined) return '-';
  const prefix = percent >= 0 ? '+' : '';
  return `${prefix}${percent.toFixed(1)}%`;
};

const formatTime = (date: Date, lang: Language): string => {
  if (lang === 'ar') {
    return date.toLocaleString('ar-SA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Direction emoji helper
const getDirectionEmoji = (direction: string): string => {
  const dir = direction.toUpperCase();
  if (dir === 'CALL' || dir === 'BUY') return '📈';
  if (dir === 'PUT' || dir === 'SELL') return '📉';
  return '📊';
};

// =====================
// Trade Opened Message
// =====================
export const getTradeOpenedMessage = (trade: TradeInfo, lang: Language = 'en'): string => {
  const emoji = getDirectionEmoji(trade.direction);

  if (lang === 'ar') {
    let message = `${emoji} *صفقة جديدة مفتوحة*\n\n`;
    message += `📊 *الرمز:* ${trade.symbol}\n`;
    message += `🎯 *الاتجاه:* ${trade.direction === 'CALL' ? 'صعود' : 'هبوط'} (${trade.direction})\n`;
    message += `📦 *الكمية:* ${trade.quantity} عقد\n`;

    if (trade.strike) {
      message += `📍 *الاسترايك:* ${formatNumber(trade.strike, 0)}\n`;
    }
    if (trade.entryPrice) {
      message += `💰 *سعر الدخول:* $${formatNumber(trade.entryPrice)}\n`;
    }
    if (trade.delta) {
      message += `📐 *الدلتا:* ${formatNumber(trade.delta, 3)}\n`;
    }
    if (trade.expiry) {
      message += `📅 *الاستحقاق:* ${trade.expiry}\n`;
    }
    if (trade.stopLoss) {
      message += `🛑 *وقف الخسارة:* $${formatNumber(trade.stopLoss)}\n`;
    }
    if (trade.takeProfit) {
      message += `✅ *جني الأرباح:* $${formatNumber(trade.takeProfit)}\n`;
    }
    if (trade.spread !== null && trade.spread !== undefined) {
      message += `📊 *السبريد:* ${formatPercent(trade.spread)}\n`;
    }
    if (trade.volume) {
      message += `💧 *السيولة:* ${trade.volume} عقد\n`;
    }

    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;

    return message;
  }

  // English
  let message = `${emoji} *Trade Opened*\n\n`;
  message += `📊 *Symbol:* ${trade.symbol}\n`;
  message += `🎯 *Direction:* ${trade.direction}\n`;
  message += `📦 *Quantity:* ${trade.quantity} contracts\n`;

  if (trade.strike) {
    message += `📍 *Strike:* ${formatNumber(trade.strike, 0)}\n`;
  }
  if (trade.entryPrice) {
    message += `💰 *Entry Price:* $${formatNumber(trade.entryPrice)}\n`;
  }
  if (trade.delta) {
    message += `📐 *Delta:* ${formatNumber(trade.delta, 3)}\n`;
  }
  if (trade.expiry) {
    message += `📅 *Expiry:* ${trade.expiry}\n`;
  }
  if (trade.stopLoss) {
    message += `🛑 *Stop Loss:* $${formatNumber(trade.stopLoss)}\n`;
  }
  if (trade.takeProfit) {
    message += `✅ *Take Profit:* $${formatNumber(trade.takeProfit)}\n`;
  }
  if (trade.spread !== null && trade.spread !== undefined) {
    message += `📊 *Spread:* ${formatPercent(trade.spread)}\n`;
  }
  if (trade.volume) {
    message += `💧 *Liquidity:* ${trade.volume} contracts\n`;
  }

  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;

  return message;
};

// =====================
// Trade Closed Message
// =====================
export const getTradeClosedMessage = (trade: TradeInfo, lang: Language = 'en'): string => {
  const directionEmoji = getDirectionEmoji(trade.direction);
  const pnlEmoji = trade.pnl && trade.pnl >= 0 ? '💰' : '🔴';
  const resultEmoji = trade.pnl && trade.pnl >= 0 ? '🎉' : '📉';

  if (lang === 'ar') {
    let message = `${pnlEmoji} *صفقة مغلقة* ${resultEmoji}\n\n`;
    message += `${directionEmoji} *${trade.symbol}*\n`;
    message += `🎯 *الاتجاه:* ${trade.direction === 'CALL' ? 'صعود' : 'هبوط'} (${trade.direction})\n`;
    message += `📦 *الكمية:* ${trade.quantity} عقد\n`;

    if (trade.strike) {
      message += `📍 *الاسترايك:* ${formatNumber(trade.strike, 0)}\n`;
    }
    if (trade.entryPrice) {
      message += `💰 *سعر الدخول:* $${formatNumber(trade.entryPrice)}\n`;
    }
    if (trade.exitPrice) {
      message += `🚪 *سعر الخروج:* $${formatNumber(trade.exitPrice)}\n`;
    }

    if (trade.pnl !== null && trade.pnl !== undefined) {
      const pnlFormatted = formatCurrency(trade.pnl);
      const pnlPercentFormatted = trade.pnlPercent ? formatPercent(trade.pnlPercent) : '';
      message += `\n💵 *الربح/الخسارة:* ${pnlFormatted}`;
      if (pnlPercentFormatted) {
        message += ` (${pnlPercentFormatted})`;
      }
      message += '\n';
    }

    if (trade.slippage) {
      message += `⚡ *الانزلاق السعري:* ${formatPercent(trade.slippage)}\n`;
    }

    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;

    return message;
  }

  // English
  let message = `${pnlEmoji} *Trade Closed* ${resultEmoji}\n\n`;
  message += `${directionEmoji} *${trade.symbol}*\n`;
  message += `🎯 *Direction:* ${trade.direction}\n`;
  message += `📦 *Quantity:* ${trade.quantity} contracts\n`;

  if (trade.strike) {
    message += `📍 *Strike:* ${formatNumber(trade.strike, 0)}\n`;
  }
  if (trade.entryPrice) {
    message += `💰 *Entry Price:* $${formatNumber(trade.entryPrice)}\n`;
  }
  if (trade.exitPrice) {
    message += `🚪 *Exit Price:* $${formatNumber(trade.exitPrice)}\n`;
  }

  if (trade.pnl !== null && trade.pnl !== undefined) {
    const pnlFormatted = formatCurrency(trade.pnl);
    const pnlPercentFormatted = trade.pnlPercent ? formatPercent(trade.pnlPercent) : '';
    message += `\n💵 *P&L:* ${pnlFormatted}`;
    if (pnlPercentFormatted) {
      message += ` (${pnlPercentFormatted})`;
    }
    message += '\n';
  }

  if (trade.slippage) {
    message += `⚡ *Slippage:* ${formatPercent(trade.slippage)}\n`;
  }

  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;

  return message;
};

// =====================
// Trade Updated Message
// =====================
export const getTradeUpdatedMessage = (trade: TradeInfo, updateType: string, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `📝 *تحديث الصفقة*\n\n`;
    message += `📊 *الرمز:* ${trade.symbol}\n`;
    message += `🔄 *نوع التحديث:* ${updateType}\n`;

    if (trade.stopLoss) {
      message += `🛑 *وقف الخسارة الجديد:* $${formatNumber(trade.stopLoss)}\n`;
    }
    if (trade.takeProfit) {
      message += `✅ *جني الأرباح الجديد:* $${formatNumber(trade.takeProfit)}\n`;
    }
    if (trade.pnl !== null && trade.pnl !== undefined) {
      message += `💵 *الربح/الخسارة الحالي:* ${formatCurrency(trade.pnl)}\n`;
    }

    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    return message;
  }

  // English
  let message = `📝 *Trade Updated*\n\n`;
  message += `📊 *Symbol:* ${trade.symbol}\n`;
  message += `🔄 *Update Type:* ${updateType}\n`;

  if (trade.stopLoss) {
    message += `🛑 *New Stop Loss:* $${formatNumber(trade.stopLoss)}\n`;
  }
  if (trade.takeProfit) {
    message += `✅ *New Take Profit:* $${formatNumber(trade.takeProfit)}\n`;
  }
  if (trade.pnl !== null && trade.pnl !== undefined) {
    message += `💵 *Current P&L:* ${formatCurrency(trade.pnl)}\n`;
  }

  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  return message;
};

// =====================
// Trailing Stop Activated Message
// =====================
export const getTrailingStopMessage = (trade: TradeInfo, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `🔀 *الوقف المتحرك مفعّل*\n\n`;
    message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

    if (trade.strike) {
      message += `📍 *الاسترايك:* ${formatNumber(trade.strike, 0)}\n`;
    }
    if (trade.pnl !== null && trade.pnl !== undefined) {
      message += `💵 *الربح الحالي:* ${formatCurrency(trade.pnl)}\n`;
    }
    if (trade.stopLoss) {
      message += `🛑 *وقف الخسارة المتحرك:* $${formatNumber(trade.stopLoss)}\n`;
    }

    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;

    return message;
  }

  // English
  let message = `🔀 *Trailing Stop Activated*\n\n`;
  message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

  if (trade.strike) {
    message += `📍 *Strike:* ${formatNumber(trade.strike, 0)}\n`;
  }
  if (trade.pnl !== null && trade.pnl !== undefined) {
    message += `💵 *Current Profit:* ${formatCurrency(trade.pnl)}\n`;
  }
  if (trade.stopLoss) {
    message += `🛑 *Trailing Stop:* $${formatNumber(trade.stopLoss)}\n`;
  }

  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;

  return message;
};

// =====================
// Stop Loss Alert (Pre-Close Warning)
// =====================
export const getStopLossAlertMessage = (trade: TradeInfo, distancePercent: number, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `⚠️ *تحذير من وقف الخسارة*\n\n`;
    message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

    if (trade.strike) {
      message += `📍 *الاسترايك:* ${formatNumber(trade.strike, 0)}\n`;
    }
    if (trade.pnl !== null && trade.pnl !== undefined) {
      message += `💵 *الخسارة الحالية:* ${formatCurrency(trade.pnl)}\n`;
    }
    if (trade.stopLoss) {
      message += `🛑 *وقف الخسارة:* $${formatNumber(trade.stopLoss)}\n`;
    }

    message += `\n📊 *البعد عن وقف الخسارة:* ${formatPercent(distancePercent)}%\n`;
    message += `⚠️ *تحذير:* الصفقة تقترب من وقف الخسارة!\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;

    return message;
  }

  // English
  let message = `⚠️ *Stop Loss Alert*\n\n`;
  message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

  if (trade.strike) {
    message += `📍 *Strike:* ${formatNumber(trade.strike, 0)}\n`;
  }
  if (trade.pnl !== null && trade.pnl !== undefined) {
    message += `💵 *Current Loss:* ${formatCurrency(trade.pnl)}\n`;
  }
  if (trade.stopLoss) {
    message += `🛑 *Stop Loss:* $${formatNumber(trade.stopLoss)}\n`;
  }

  message += `\n📊 *Distance to Stop:* ${formatPercent(distancePercent)}%\n`;
  message += `⚠️ *Warning:* Trade is approaching stop loss!\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;

  return message;
};

// =====================
// Take Profit Alert (Near Target)
// =====================
export const getTakeProfitAlertMessage = (trade: TradeInfo, distancePercent: number, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `🎯 *تنبيه جني الأرباح*\n\n`;
    message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

    if (trade.strike) {
      message += `📍 *الاسترايك:* ${formatNumber(trade.strike, 0)}\n`;
    }
    if (trade.pnl !== null && trade.pnl !== undefined) {
      message += `💵 *الربح الحالي:* ${formatCurrency(trade.pnl)}\n`;
    }
    if (trade.takeProfit) {
      message += `✅ *هدف الربح:* $${formatNumber(trade.takeProfit)}\n`;
    }

    message += `\n📊 *البعد عن الهدف:* ${formatPercent(distancePercent)}%\n`;
    message += `💡 *تلميح:* الصفقة تقترب من هدف الربح!\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;

    return message;
  }

  // English
  let message = `🎯 *Take Profit Alert*\n\n`;
  message += `${getDirectionEmoji(trade.direction)} *${trade.symbol}*\n`;

  if (trade.strike) {
    message += `📍 *Strike:* ${formatNumber(trade.strike, 0)}\n`;
  }
  if (trade.pnl !== null && trade.pnl !== undefined) {
    message += `💵 *Current Profit:* ${formatCurrency(trade.pnl)}\n`;
  }
  if (trade.takeProfit) {
    message += `✅ *Target Profit:* $${formatNumber(trade.takeProfit)}\n`;
  }

  message += `\n📊 *Distance to Target:* ${formatPercent(distancePercent)}%\n`;
  message += `💡 *Tip:* Trade is approaching profit target!\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;

  return message;
};

// =====================
// Daily Report Message
// =====================
export const getDailyReportMessage = (report: DailyReportInfo, lang: Language = 'en'): string => {
  const today = new Date();

  if (lang === 'ar') {
    let message = `📊 *التقرير اليومي*\n`;
    message += `📅 ${formatTime(today, 'ar')}\n\n`;

    message += `📈 *ملخص التداول:*\n`;
    message += `• إجمالي الصفقات: ${report.totalTrades}\n`;
    message += `• صفقات رابحة: ${report.winningTrades} ✅\n`;
    message += `• صفقات خاسرة: ${report.losingTrades} ❌\n`;
    message += `• نسبة الفوز: ${formatPercent(report.winRate)}\n\n`;

    message += `💵 *الأداء المالي:*\n`;
    message += `• إجمالي الربح/الخسارة: ${formatCurrency(report.totalPnL)}\n`;
    message += `• أفضل صفقة: ${formatCurrency(report.bestTrade)}\n`;
    message += `• أسوأ صفقة: ${formatCurrency(report.worstTrade)}\n\n`;

    if (report.totalPnL >= 0) {
      message += `🎉 *يوم رائع! استمر في العمل الجيد!*\n`;
    } else {
      message += `💪 *غداً يوم أفضل! حافظ على تركيزك.*\n`;
    }

    message += `\n🤖 _بوت التداول الاحترافي_`;

    return message;
  }

  // English
  let message = `📊 *Daily Trading Report*\n`;
  message += `📅 ${formatTime(today, 'en')}\n\n`;

  message += `📈 *Trading Summary:*\n`;
  message += `• Total Trades: ${report.totalTrades}\n`;
  message += `• Winning Trades: ${report.winningTrades} ✅\n`;
  message += `• Losing Trades: ${report.losingTrades} ❌\n`;
  message += `• Win Rate: ${formatPercent(report.winRate)}\n\n`;

  message += `💵 *Financial Performance:*\n`;
  message += `• Total P&L: ${formatCurrency(report.totalPnL)}\n`;
  message += `• Best Trade: ${formatCurrency(report.bestTrade)}\n`;
  message += `• Worst Trade: ${formatCurrency(report.worstTrade)}\n\n`;

  if (report.totalPnL >= 0) {
    message += `🎉 *Great day! Keep up the good work!*\n`;
  } else {
    message += `💪 *Tomorrow is a new day! Stay focused.*\n`;
  }

  message += `\n🤖 _Trading Bot Pro_`;

  return message;
};

// =====================
// Price Alert Message
// =====================
export const getPriceAlertMessage = (alert: AlertInfo, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let conditionText = '';
    switch (alert.condition) {
      case 'ABOVE':
        conditionText = 'فوق';
        break;
      case 'BELOW':
        conditionText = 'تحت';
        break;
      case 'CROSSES':
        conditionText = 'عبر';
        break;
      default:
        conditionText = alert.condition;
    }

    let message = `🔔 *تنبيه سعري مفعّل*\n\n`;
    message += `📊 *الرمز:* ${alert.symbol}\n`;
    message += `🎯 *الهدف:* $${formatNumber(alert.targetValue)}\n`;
    message += `📈 *الشرط:* ${conditionText}\n`;

    if (alert.currentPrice) {
      message += `💰 *السعر الحالي:* $${formatNumber(alert.currentPrice)}\n`;
    }

    if (alert.customMessage) {
      message += `\n📝 *ملاحظة:* ${alert.customMessage}\n`;
    }

    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;

    return message;
  }

  // English
  let message = `🔔 *Price Alert Triggered*\n\n`;
  message += `📊 *Symbol:* ${alert.symbol}\n`;
  message += `🎯 *Target:* $${formatNumber(alert.targetValue)}\n`;
  message += `📈 *Condition:* ${alert.condition}\n`;

  if (alert.currentPrice) {
    message += `💰 *Current Price:* $${formatNumber(alert.currentPrice)}\n`;
  }

  if (alert.customMessage) {
    message += `\n📝 *Note:* ${alert.customMessage}\n`;
  }

  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;

  return message;
};

// =====================
// Error/Warning Messages
// =====================
export const getErrorMessage = (errorType: string, details: string, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `🚨 *خطأ في النظام*\n\n`;
    message += `⚠️ *نوع الخطأ:* ${errorType}\n`;
    message += `📝 *التفاصيل:* ${details}\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;
    return message;
  }

  // English
  let message = `🚨 *System Error*\n\n`;
  message += `⚠️ *Error Type:* ${errorType}\n`;
  message += `📝 *Details:* ${details}\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;
  return message;
};

export const getSpreadWarningMessage = (spread: number, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `⚠️ *تحذير: سبريد عالي*\n\n`;
    message += `📊 *السبريد:* ${formatPercent(spread)}\n`;
    message += `🚫 *تم رفض الصفقة لحمايتك*\n\n`;
    message += `💡 *نصيحة:* انتظر تحسن السبريد أو استخدم أوامر محددة.\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    return message;
  }

  // English
  let message = `⚠️ *High Spread Warning*\n\n`;
  message += `📊 *Spread:* ${formatPercent(spread)}\n`;
  message += `🚫 *Trade rejected for your protection*\n\n`;
  message += `💡 *Tip:* Wait for better spread or use limit orders.\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  return message;
};

export const getLiquidityWarningMessage = (volume: number, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `⚠️ *تحذير: سيولة منخفضة*\n\n`;
    message += `💧 *السيولة المتاحة:* ${volume} عقد\n`;
    message += `🚫 *تم رفض الصفقة لحمايتك*\n\n`;
    message += `💡 *نصيحة:* انتظر تحسن السيولة.\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    return message;
  }

  // English
  let message = `⚠️ *Low Liquidity Warning*\n\n`;
  message += `💧 *Available Liquidity:* ${volume} contracts\n`;
  message += `🚫 *Trade rejected for your protection*\n\n`;
  message += `💡 *Tip:* Wait for better liquidity.\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  return message;
};

// =====================
// Daily Loss Limit Reached
// =====================
export const getDailyLimitMessage = (loss: number, limit: number, lang: Language = 'en'): string => {
  if (lang === 'ar') {
    let message = `🛑 *حد الخسارة اليومية*\n\n`;
    message += `💸 *الخسارة اليومية:* ${formatCurrency(loss)}\n`;
    message += `🎯 *الحد المحدد:* $${formatNumber(limit)}\n\n`;
    message += `⛔ *تم إيقاف التداول لليوم*\n`;
    message += `📅 *سيتجد التداول غداً*\n\n`;
    message += `💪 *احافظ على هدوئك وركز على الغد!*\n`;
    message += `\n⏰ *الوقت:* ${formatTime(new Date(), 'ar')}`;
    message += `\n\n🤖 _بوت التداول الاحترافي_`;
    return message;
  }

  // English
  let message = `🛑 *Daily Loss Limit Reached*\n\n`;
  message += `💸 *Daily Loss:* ${formatCurrency(loss)}\n`;
  message += `🎯 *Set Limit:* $${formatNumber(limit)}\n\n`;
  message += `⛔ *Trading paused for today*\n`;
  message += `📅 *Will resume tomorrow*\n\n`;
  message += `💪 *Stay calm and focus on tomorrow!*\n`;
  message += `\n⏰ *Time:* ${formatTime(new Date(), 'en')}`;
  message += `\n\n🤖 _Trading Bot Pro_`;
  return message;
};

// =====================
// Bot Status Messages
// =====================
export const getBotStartedMessage = (lang: Language = 'en'): string => {
  if (lang === 'ar') {
    return `🤖 *تم تشغيل البوت*\n\n✅ البوت يعمل الآن ويستقبل الإشارات.\n\n⏰ ${formatTime(new Date(), 'ar')}\n\n🤖 _بوت التداول الاحترافي_`;
  }
  return `🤖 *Bot Started*\n\n✅ Bot is now running and accepting signals.\n\n⏰ ${formatTime(new Date(), 'en')}\n\n🤖 _Trading Bot Pro_`;
};

export const getBotStoppedMessage = (lang: Language = 'en'): string => {
  if (lang === 'ar') {
    return `🛑 *تم إيقاف البوت*\n\n⏸️ البوت متوقف مؤقتاً.\n\n⏰ ${formatTime(new Date(), 'ar')}\n\n🤖 _بوت التداول الاحترافي_`;
  }
  return `🛑 *Bot Stopped*\n\n⏸️ Bot has been paused.\n\n⏰ ${formatTime(new Date(), 'en')}\n\n🤖 _Trading Bot Pro_`;
};

export const getConnectionLostMessage = (lang: Language = 'en'): string => {
  if (lang === 'ar') {
    return `⚠️ *فقدان الاتصال*\n\n🔌 تم فقدان الاتصال مع Interactive Brokers.\n🔄 جاري محاولة إعادة الاتصال...\n\n⏰ ${formatTime(new Date(), 'ar')}\n\n🤖 _بوت التداول الاحترافي_`;
  }
  return `⚠️ *Connection Lost*\n\n🔌 Connection to Interactive Brokers lost.\n🔄 Attempting to reconnect...\n\n⏰ ${formatTime(new Date(), 'en')}\n\n🤖 _Trading Bot Pro_`;
};

export const getConnectionRestoredMessage = (lang: Language = 'en'): string => {
  if (lang === 'ar') {
    return `✅ *تم استعادة الاتصال*\n\n🔌 الاتصال مع Interactive Brokers تم استعادته.\n✅ البوت يعمل بشكل طبيعي.\n\n⏰ ${formatTime(new Date(), 'ar')}\n\n🤖 _بوت التداول الاحترافي_`;
  }
  return `✅ *Connection Restored*\n\n🔌 Connection to Interactive Brokers restored.\n✅ Bot is operating normally.\n\n⏰ ${formatTime(new Date(), 'en')}\n\n🤖 _Trading Bot Pro_`;
};

// =====================
// Test Message
// =====================
export const getTestMessage = (lang: Language = 'en'): string => {
  if (lang === 'ar') {
    return `🔔 *رسالة اختبار*\n\nتم إرسال هذه الرسالة للتأكد من أن إعدادات التلقرام صحيحة.\n\n✅ الإعدادات تعمل بشكل صحيح!\n\n⏰ ${formatTime(new Date(), 'ar')}\n\n🤖 _بوت التداول الاحترافي_`;
  }
  return `🔔 *Test Message*\n\nThis is a test message to verify your Telegram settings are correct.\n\n✅ Settings are working properly!\n\n⏰ ${formatTime(new Date(), 'en')}\n\n🤖 _Trading Bot Pro_`;
};
