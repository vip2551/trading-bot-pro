/**
 * Telegram Bot Service
 * Handles notifications and commands via Telegram
 * Supports Arabic and English notifications
 */

import { db } from './db';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  language: 'ar' | 'en';
  notifications: TelegramNotifications;
}

export interface TelegramNotifications {
  tradeExecuted: boolean;
  tradeClosed: boolean;
  orderFilled: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  errorAlerts: boolean;
  systemAlerts: boolean;
  whaleActivity: boolean;
  priceUpdates: boolean;
}

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableNotification?: boolean;
}

export interface TelegramUser {
  id: number;
  isBot: boolean;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Arabic translations
const ARABIC = {
  tradeOpened: '🔔 تم فتح صفقة جديدة',
  tradeClosed: '✅ تم إغلاق الصفقة',
  priceUpdate: '📊 تحديث السعر',
  symbol: 'السهم',
  strike: 'الاسترايك',
  strikePrice: 'سعر الاسترايك',
  stockPrice: 'السعر الحالي للسهم',
  direction: 'الاتجاه',
  contracts: 'عدد العقود',
  currentPrice: 'السعر الحالي',
  entryPrice: 'سعر الدخول',
  exitPrice: 'سعر الخروج',
  pnl: 'الربح/الخسارة',
  executionTime: 'وقت التنفيذ',
  closeTime: 'وقت الإغلاق',
  call: 'كول 📈',
  put: 'بوت 📉',
  callEmoji: '📈 كول',
  putEmoji: '📉 بوت',
  profit: 'ربح',
  loss: 'خسارة',
  fromBot: 'بوت التداول برو',
  dailyReport: '📊 التقرير اليومي',
  totalTrades: 'إجمالي الصفقات',
  winRate: 'نسبة الفوز',
  error: '⚠️ تنبيه خطأ',
  systemAlert: 'ℹ️ تنبيه النظام',
};

// English translations
const ENGLISH = {
  tradeOpened: '🔔 New Trade Opened',
  tradeClosed: '✅ Trade Closed',
  priceUpdate: '📊 Price Update',
  symbol: 'Symbol',
  strike: 'Strike',
  strikePrice: 'Strike Price',
  stockPrice: 'Stock Price',
  direction: 'Direction',
  contracts: 'Contracts',
  currentPrice: 'Current Price',
  entryPrice: 'Entry Price',
  exitPrice: 'Exit Price',
  pnl: 'P&L',
  executionTime: 'Execution Time',
  closeTime: 'Close Time',
  call: 'CALL 📈',
  put: 'PUT 📉',
  callEmoji: '📈 CALL',
  putEmoji: '📉 PUT',
  profit: 'Profit',
  loss: 'Loss',
  fromBot: 'Trading Bot Pro',
  dailyReport: '📊 Daily Report',
  totalTrades: 'Total Trades',
  winRate: 'Win Rate',
  error: '⚠️ Error Alert',
  systemAlert: 'ℹ️ System Alert',
};

// Telegram Bot Service
export class TelegramService {
  private config: TelegramConfig | null = null;
  private baseUrl: string = '';
  private lastUpdateId: number = 0;
  private pollingInterval: NodeJS.Timeout | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {}

  // Get translation
  private t(key: keyof typeof ARABIC, fallback?: string): string {
    if (!this.config) return ENGLISH[key] || fallback || key;
    return this.config.language === 'ar' ? (ARABIC[key] || fallback || key) : (ENGLISH[key] || fallback || key);
  }

  // Configure the bot
  configure(config: TelegramConfig): void {
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  // Test bot connection
  async testConnection(): Promise<{ success: boolean; botInfo?: any; error?: string }> {
    if (!this.config?.botToken) {
      return { success: false, error: 'Bot token not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();

      if (data.ok) {
        return { success: true, botInfo: data.result };
      } else {
        return { success: false, error: data.description };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get chat info
  async getChatInfo(chatId: string): Promise<{ success: boolean; chat?: TelegramChat; error?: string }> {
    if (!this.config?.botToken) {
      return { success: false, error: 'Bot token not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/getChat?chat_id=${chatId}`);
      const data = await response.json();

      if (data.ok) {
        return { success: true, chat: data.result };
      } else {
        return { success: false, error: data.description };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Send message
  async sendMessage(message: TelegramMessage, skipEnabledCheck = false): Promise<{ success: boolean; messageId?: number; error?: string }> {
    if (!this.config?.botToken) {
      return { success: false, error: 'Bot token not configured' };
    }
    
    if (!skipEnabledCheck && !this.config.enabled) {
      return { success: false, error: 'Telegram notifications are disabled' };
    }

    try {
      const body: any = {
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_notification: message.disableNotification || false
      };

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.ok) {
        return { success: true, messageId: data.result.message_id };
      } else {
        return { success: false, error: data.description || 'Unknown Telegram API error' };
      }
    } catch (error: any) {
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  // Send trade opened notification (Arabic)
  async sendTradeOpenedNotification(trade: {
    symbol: string;
    direction: 'CALL' | 'PUT';
    strike: number;
    strikePrice: number;
    contracts: number;
    stockPrice: number;
    entryPrice: number;
    executionTime: Date;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.enabled || !this.config.notifications.tradeExecuted) {
      return { success: false, error: 'Notifications disabled' };
    }

    const isArabic = this.config.language === 'ar';
    const directionText = trade.direction === 'CALL' ? this.t('callEmoji') : this.t('putEmoji');
    const time = trade.executionTime.toLocaleString(isArabic ? 'ar-SA' : 'en-US');

    const message = `
<b>${this.t('tradeOpened')}</b>

${trade.direction === 'CALL' ? '📈' : '📉'} <b>${trade.symbol}</b> ${directionText}
━━━━━━━━━━━━━━━
📌 <b>${this.t('strike')}:</b> ${trade.strike}
💰 <b>${this.t('strikePrice')}:</b> $${trade.strikePrice.toFixed(2)}
📊 <b>${this.t('stockPrice')}:</b> $${trade.stockPrice.toFixed(2)}
📝 <b>${this.t('contracts')}:</b> ${trade.contracts}
💵 <b>${this.t('entryPrice')}:</b> $${trade.entryPrice.toFixed(2)}
⏰ <b>${this.t('executionTime')}:</b> ${time}

<i>${this.t('fromBot')}</i>
`;

    const result = await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML'
    });

    return result;
  }

  // Send price update notification
  async sendPriceUpdateNotification(update: {
    symbol: string;
    direction: 'CALL' | 'PUT';
    strike: number;
    currentPrice: number;
    stockPrice: number;
    pnl: number;
    contracts: number;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.enabled || !this.config.notifications.priceUpdates) {
      return { success: false, error: 'Price updates disabled' };
    }

    const isArabic = this.config.language === 'ar';
    const directionText = update.direction === 'CALL' ? this.t('callEmoji') : this.t('putEmoji');
    const pnlEmoji = update.pnl >= 0 ? '🟢' : '🔴';
    const time = new Date().toLocaleString(isArabic ? 'ar-SA' : 'en-US');

    const message = `
<b>${this.t('priceUpdate')}</b> ⏱️

${update.direction === 'CALL' ? '📈' : '📉'} <b>${update.symbol}</b> ${directionText}
━━━━━━━━━━━━━━━
📌 <b>${this.t('strike')}:</b> ${update.strike}
💰 <b>${this.t('currentPrice')}:</b> $${update.currentPrice.toFixed(2)}
📊 <b>${this.t('stockPrice')}:</b> $${update.stockPrice.toFixed(2)}
${pnlEmoji} <b>${this.t('pnl')}:</b> ${update.pnl >= 0 ? '+' : ''}$${update.pnl.toFixed(2)}

⏰ ${time}
`;

    const result = await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML',
      disableNotification: true // Silent notification for price updates
    });

    return result;
  }

  // Send trade closed notification
  async sendTradeClosedNotification(trade: {
    symbol: string;
    direction: 'CALL' | 'PUT';
    strike: number;
    contracts: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    openTime: Date;
    closeTime: Date;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.enabled || !this.config.notifications.tradeClosed) {
      return { success: false, error: 'Notifications disabled' };
    }

    const isArabic = this.config.language === 'ar';
    const directionText = trade.direction === 'CALL' ? this.t('callEmoji') : this.t('putEmoji');
    const pnlEmoji = trade.pnl >= 0 ? '🟢' : '🔴';
    const resultText = trade.pnl >= 0 ? this.t('profit') : this.t('loss');
    const openTime = trade.openTime.toLocaleString(isArabic ? 'ar-SA' : 'en-US');
    const closeTime = trade.closeTime.toLocaleString(isArabic ? 'ar-SA' : 'en-US');

    const message = `
<b>${this.t('tradeClosed')}</b> ${pnlEmoji}

${trade.direction === 'CALL' ? '📈' : '📉'} <b>${trade.symbol}</b> ${directionText}
━━━━━━━━━━━━━━━
📌 <b>${this.t('strike')}:</b> ${trade.strike}
📝 <b>${this.t('contracts')}:</b> ${trade.contracts}
💵 <b>${this.t('entryPrice')}:</b> $${trade.entryPrice.toFixed(2)}
🔚 <b>${this.t('exitPrice')}:</b> $${trade.exitPrice.toFixed(2)}
${pnlEmoji} <b>${this.t('pnl')}:</b> ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)} (${resultText})

⏰ <b>${this.t('executionTime')}:</b> ${openTime}
🏁 <b>${this.t('closeTime')}:</b> ${closeTime}

<i>${this.t('fromBot')}</i>
`;

    const result = await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML'
    });

    return result;
  }

  // Send trade notification (legacy - kept for compatibility)
  async sendTradeNotification(trade: {
    symbol: string;
    direction: string;
    quantity: number;
    entryPrice: number;
    status: string;
    pnl?: number;
    strike?: number;
    strikePrice?: number;
    stockPrice?: number;
  }): Promise<void> {
    if (!this.config?.enabled || !this.config.notifications.tradeExecuted) return;

    const isArabic = this.config.language === 'ar';
    const directionText = trade.direction === 'CALL' || trade.direction === 'BUY' 
      ? (isArabic ? '📈 كول' : '📈 CALL') 
      : (isArabic ? '📉 بوت' : '📉 PUT');
    const pnlEmoji = trade.pnl && trade.pnl >= 0 ? '🟢' : '🔴';
    const time = new Date().toLocaleString(isArabic ? 'ar-SA' : 'en-US');
    
    const message = `
<b>${isArabic ? '🔔 صفقة ' + trade.status : '🔔 Trade ' + trade.status}</b>

${directionText} <b>${trade.symbol}</b>
━━━━━━━━━━━━━━━
${trade.strike ? `<b>${isArabic ? '📌 الاسترايك:' : '📌 Strike:'}</b> ${trade.strike}` : ''}
${trade.strikePrice ? `<b>${isArabic ? '💰 سعر الاسترايك:' : '💰 Strike Price:'}</b> $${trade.strikePrice.toFixed(2)}` : ''}
${trade.stockPrice ? `<b>${isArabic ? '📊 سعر السهم:' : '📊 Stock Price:'}</b> $${trade.stockPrice.toFixed(2)}` : ''}
<b>${isArabic ? '📝 الكمية:' : '📝 Quantity:'}</b> ${trade.quantity}
<b>${isArabic ? '💵 سعر الدخول:' : '💵 Entry Price:'}</b> $${trade.entryPrice.toFixed(2)}
${trade.pnl ? `<b>${isArabic ? '📊 الربح/الخسارة:' : '📊 P&L:'}</b> ${pnlEmoji} $${trade.pnl.toFixed(2)}` : ''}
<b>${isArabic ? '⏰ الوقت:' : '⏰ Time:'}</b> ${time}

<i>${this.t('fromBot')}</i>
`;

    await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML'
    });
  }

  // Send whale activity alert
  async sendWhaleAlert(whale: {
    symbol: string;
    direction: string;
    volume: number;
    confidence: number;
  }): Promise<void> {
    if (!this.config?.enabled || !this.config.notifications.whaleActivity) return;

    const isArabic = this.config.language === 'ar';
    const emoji = whale.direction === 'BULLISH' ? '🐋' : '🐻';
    
    const message = `
<b>${emoji} ${isArabic ? 'تم رصد نشاط حيتان!' : 'Whale Activity Detected!'}</b>

<b>${isArabic ? 'السهم:' : 'Symbol:'}</b> ${whale.symbol}
<b>${isArabic ? 'الاتجاه:' : 'Direction:'}</b> ${whale.direction}
<b>${isArabic ? 'الحجم:' : 'Volume:'}</b> $${(whale.volume / 1000000).toFixed(2)}M
<b>${isArabic ? 'الثقة:' : 'Confidence:'}</b> ${whale.confidence}%

<i>${isArabic ? 'تم الكشف بواسطة متتبع الحيتان' : 'Detected by AI Whale Tracker'}</i>
`;

    await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML'
    });
  }

  // Send daily report
  async sendDailyReport(report: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    bestTrade: string;
    worstTrade: string;
  }): Promise<void> {
    if (!this.config?.enabled || !this.config.notifications.dailyReport) return;

    const isArabic = this.config.language === 'ar';
    const pnlEmoji = report.totalPnL >= 0 ? '🟢' : '🔴';
    const date = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
    
    const message = `
<b>${this.t('dailyReport')}</b>
<i>${date}</i>

━━━━━━━━━━━━━━━
<b>📈 ${this.t('totalTrades')}:</b> ${report.totalTrades}
<b>🎯 ${this.t('winRate')}:</b> ${report.winRate.toFixed(1)}%
<b>${pnlEmoji} ${this.t('pnl')}:</b> ${report.totalPnL >= 0 ? '+' : ''}$${report.totalPnL.toFixed(2)}

<b>🏆 ${isArabic ? 'أفضل صفقة:' : 'Best Trade:'}</b> ${report.bestTrade}
<b>📉 ${isArabic ? 'أسوأ صفقة:' : 'Worst Trade:'}</b> ${report.worstTrade}
━━━━━━━━━━━━━━━

<i>${this.t('fromBot')}</i>
`;

    await this.sendMessage({
      chatId: this.config.chatId,
      text: message,
      parseMode: 'HTML'
    });
  }

  // Send error alert
  async sendErrorAlert(error: {
    type: string;
    message: string;
    timestamp: Date;
  }): Promise<void> {
    if (!this.config?.enabled || !this.config.notifications.errorAlerts) return;

    const isArabic = this.config.language === 'ar';
    const time = error.timestamp.toLocaleString(isArabic ? 'ar-SA' : 'en-US');

    const msg = `
<b>${this.t('error')}</b>

<b>${isArabic ? 'النوع:' : 'Type:'}</b> ${error.type}
<b>${isArabic ? 'الرسالة:' : 'Message:'}</b> ${error.message}
<b>${isArabic ? 'الوقت:' : 'Time:'}</b> ${time}

<i>${isArabic ? 'يرجى التحقق من سجلات البوت' : 'Please check the bot logs for details.'}</i>
`;

    await this.sendMessage({
      chatId: this.config.chatId,
      text: msg,
      parseMode: 'HTML'
    });
  }

  // Send system alert
  async sendSystemAlert(alert: {
    type: 'info' | 'warning' | 'critical';
    message: string;
  }): Promise<void> {
    if (!this.config?.enabled || !this.config.notifications.systemAlerts) return;

    const isArabic = this.config.language === 'ar';
    const emoji = alert.type === 'info' ? 'ℹ️' : alert.type === 'warning' ? '⚠️' : '🚨';
    
    const msg = `
<b>${emoji} ${this.t('systemAlert')}</b>

${alert.message}

<b>${isArabic ? 'الوقت:' : 'Time:'}</b> ${new Date().toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
`;

    await this.sendMessage({
      chatId: this.config.chatId,
      text: msg,
      parseMode: 'HTML'
    });
  }

  // Start polling for commands
  startPolling(handler: (command: string, args: string[], user: TelegramUser) => Promise<void>): void {
    if (!this.config?.botToken) {
      console.error('Telegram bot token not configured');
      return;
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${this.baseUrl}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=1`
        );
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.lastUpdateId = update.update_id;

            if (update.message?.text) {
              const text = update.message.text;
              const parts = text.split(' ');
              const command = parts[0].toLowerCase();
              const args = parts.slice(1);

              await handler(command, args, update.message.from);
            }
          }
        }
      } catch (error) {
        console.error('Telegram polling error:', error);
      }
    }, 2000);
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }

  // Get default notifications config
  static getDefaultNotifications(): TelegramNotifications {
    return {
      tradeExecuted: true,
      tradeClosed: true,
      orderFilled: true,
      dailyReport: true,
      weeklyReport: true,
      errorAlerts: true,
      systemAlerts: true,
      whaleActivity: true,
      priceUpdates: true
    };
  }

  // Validate config
  static validateConfig(config: TelegramConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.botToken || config.botToken.trim() === '') {
      errors.push('Bot token is required');
    } else if (!config.botToken.match(/^\d+:[A-Za-z0-9_-]{35}$/)) {
      errors.push('Invalid bot token format');
    }

    if (!config.chatId || config.chatId.trim() === '') {
      errors.push('Chat ID is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const telegramService = new TelegramService();

// Command handler types
export type TelegramCommandHandler = (
  command: string, 
  args: string[], 
  user: TelegramUser
) => Promise<void>;

// Built-in commands
export const TELEGRAM_COMMANDS = {
  START: '/start',
  HELP: '/help',
  STATUS: '/status',
  POSITIONS: '/positions',
  BALANCE: '/balance',
  TRADING_ON: '/trading_on',
  TRADING_OFF: '/trading_off',
  SETTINGS: '/settings',
  REPORT: '/report',
  WHALES: '/whales'
};

export const TELEGRAM_COMMAND_HELP = `
<b>🤖 Trading Bot Pro - أوامر البوت</b>

<b>Basic Commands | الأوامر الأساسية:</b>
/start - Start the bot | تشغيل البوت
/help - Show help | المساعدة
/status - Bot status | حالة البوت

<b>Trading Commands | أوامر التداول:</b>
/positions - Open positions | الصفقات المفتوحة
/balance - Account balance | رصيد الحساب
/trading_on - Enable trading | تفعيل التداول
/trading_off - Disable trading | إيقاف التداول

<b>Reports | التقارير:</b>
/report - Today's report | تقرير اليوم
/whales - Whale activity | نشاط الحيتان

<b>Settings | الإعدادات:</b>
/settings - View settings | عرض الإعدادات
`;
