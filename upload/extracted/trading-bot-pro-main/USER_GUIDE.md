# دليل استخدام بوت التداول الاحترافي
# Trading Bot Pro User Guide

---

## 📋 المحتويات | Table of Contents

1. [نظرة عامة | Overview](#نظرة-عامة--overview)
2. [البدء | Getting Started](#البدء--getting-started)
3. [لوحة التحكم | Dashboard](#لوحة-التحكم--dashboard)
4. [إعدادات التداول | Trading Settings](#إعدادات-التداول--trading-settings)
5. [إدارة المخاطر | Risk Management](#إدارة-المخاطر--risk-management)
6. [الإشعارات | Notifications](#الإشعارات--notifications)
7. [سجل الصفقات | Trade History](#سجل-الصفقات--trade-history)
8. [التحليلات | Analytics](#التحليلات--analytics)
9. [النسخ الاحتياطي | Backup](#النسخ-الاحتياطي--backup)
10. [استكشاف الأخطاء | Troubleshooting](#استكشاف-الأخطاء--troubleshooting)

---

## نظرة عامة | Overview

### العربية

بوت التداول الاحترافي هو نظام آلي متكامل للتداول في خيارات SPX عبر منصة Interactive Brokers. يتكامل البوت مع TradingView لاستقبال الإشارات وينفذ الصفقات تلقائياً مع إرسال إشعارات فورية عبر Telegram.

**المميزات الرئيسية:**
- ✅ تنفيذ آلي للصفقات
- ✅ تكامل مع TradingView
- ✅ إشعارات Telegram بالعربية والإنجليزية
- ✅ إدارة مخاطر متقدمة
- ✅ تحليلات AI
- ✅ مخططات متقدمة
- ✅ دعم PWA للهواتف

### English

Trading Bot Pro is a comprehensive automated system for trading SPX options through Interactive Brokers. The bot integrates with TradingView to receive signals and executes trades automatically with instant Telegram notifications.

**Key Features:**
- ✅ Automated trade execution
- ✅ TradingView integration
- ✅ Telegram notifications in Arabic & English
- ✅ Advanced risk management
- ✅ AI analytics
- ✅ Advanced charts
- ✅ PWA mobile support

---

## البدء | Getting Started

### الخطوة 1: إنشاء حساب | Step 1: Create Account

```
العربية:
1. اضغط على "إنشاء حساب"
2. أدخل بريدك الإلكتروني وكلمة المرور
3. ستحصل على تجربة مجانية لمدة 7 أيام

English:
1. Click "Sign Up"
2. Enter your email and password
3. You'll get a 7-day free trial
```

### الخطوة 2: إعداد Interactive Brokers | Step 2: Setup IB

```
العربية:
1. افتح TWS أو Gateway
2. فعّل إعدادات API:
   - Configure → API → Settings
   - Enable ActiveX and Socket Clients
   - حدد المنفذ: 7497 (Paper) أو 7496 (Live)
3. أدخل الإعدادات في البوت

English:
1. Open TWS or Gateway
2. Enable API settings:
   - Configure → API → Settings
   - Enable ActiveX and Socket Clients
   - Port: 7497 (Paper) or 7496 (Live)
3. Enter settings in the bot
```

### الخطوة 3: إعداد Telegram | Step 3: Setup Telegram

```
العربية:
1. تحدث مع @BotFather في Telegram
2. أرسل /newbot لإنشاء بوت جديد
3. انسخ الـ Token
4. احصل على Chat ID من @userinfobot
5. أدخل البيانات في إعدادات الإشعارات

English:
1. Talk to @BotFather on Telegram
2. Send /newbot to create a new bot
3. Copy the Token
4. Get Chat ID from @userinfobot
5. Enter details in Notification Settings
```

---

## لوحة التحكم | Dashboard

### العربية

تعرض لوحة التحكم الرئيسية:

| العنصر | الوصف |
|--------|-------|
| **إجمالي الصفقات** | عدد جميع الصفقات المنفذة |
| **الصفقات المفتوحة** | الصفقات النشطة حالياً |
| **نسبة الفوز** | نسبة الصفقات الرابحة |
| **إجمالي P&L** | مجموع الأرباح والخسائر |
| **حالة البوت** | تشغيل/إيقاف |
| **حالة IB** | متصل/منفصل |

### English

The main dashboard displays:

| Element | Description |
|---------|-------------|
| **Total Trades** | All executed trades count |
| **Open Trades** | Currently active trades |
| **Win Rate** | Percentage of winning trades |
| **Total P&L** | Total profit and loss |
| **Bot Status** | Running/Stopped |
| **IB Status** | Connected/Disconnected |

---

## إعدادات التداول | Trading Settings

### تحديد حجم الصفقة | Position Sizing

```
العربية:

1. مبلغ ثابت ($):
   - أدخل المبلغ الذي تريد استثماره في كل صفقة
   - مثال: $500 = شراء عقود بقيمة $500

2. نسبة من المحفظة (%):
   - حدد نسبة من رصيدك
   - مثال: 5% من $10,000 = $500

3. عدد عقود ثابت:
   - حدد عدد العقود مباشرة
   - مثال: 3 عقود في كل صفقة
```

```
English:

1. Fixed Amount ($):
   - Enter the amount to invest per trade
   - Example: $500 = buy contracts worth $500

2. Portfolio Percentage (%):
   - Set a percentage of your balance
   - Example: 5% of $10,000 = $500

3. Fixed Contracts:
   - Specify number of contracts directly
   - Example: 3 contracts per trade
```

### اختيار الاسترايك | Strike Selection

```
العربية:

1. سعر العقد (موصى به):
   - البوت يبحث عن استرايك بسعر بين $300-$400
   - أفضل توازن بين المخاطرة والعائد

2. انحراف عن السعر:
   - حدد نقاط فوق/تحت السعر الحالي
   - مثال: +5 نقاط فوق SPX

3. استهداف الدلتا:
   - حدد قيمة الدلتا المستهدفة
   - مثال: 0.30 دلتا

4. يدوي:
   - حدد الاسترايك من إشارة TradingView
```

```
English:

1. Contract Price (Recommended):
   - Bot finds strike with price between $300-$400
   - Best balance between risk and reward

2. Offset from Spot:
   - Set points above/below current price
   - Example: +5 points above SPX

3. Delta Target:
   - Set target delta value
   - Example: 0.30 delta

4. Manual:
   - Specify strike from TradingView signal
```

---

## إدارة المخاطر | Risk Management

### إعدادات السبريد والسيولة | Spread & Liquidity

```
العربية:

┌─────────────────────────────────────────┐
│ ✅ التحقق من السبريد                    │
│     أقصى سبريد: 5%                      │
│     رفض الصفقات ذات السبريد العالي      │
├─────────────────────────────────────────┤
│ ✅ التحقق من السيولة                    │
│     أقل سيولة: 100 عقد                  │
│     رفض الصفقات في أسواق غير سيولة     │
├─────────────────────────────────────────┤
│ ⚡ أقصى انزلاق سعري: 1%                 │
└─────────────────────────────────────────┘

English:

┌─────────────────────────────────────────┐
│ ✅ Spread Check                         │
│     Max spread: 5%                      │
│     Reject high spread trades           │
├─────────────────────────────────────────┤
│ ✅ Liquidity Check                      │
│     Min liquidity: 100 contracts        │
│     Reject illiquid market trades       │
├─────────────────────────────────────────┤
│ ⚡ Max slippage: 1%                     │
└─────────────────────────────────────────┘
```

### الوضع الذكي | Smart Mode

```
العربية:

🔹 حماية الخسارة اليومية:
   - حدد أقصى خسارة يومية
   - يتوقف التداول عند الوصول للحد

🔹 تجنب ساعات السيولة المنخفضة:
   - تخطي التداول قبل وبعد ساعات السوق

🔹 تجنب أحداث الأخبار:
   - تخطي التداول حول الإعلانات الاقتصادية
```

```
English:

🔹 Daily Loss Protection:
   - Set maximum daily loss
   - Trading stops when limit reached

🔹 Avoid Low Liquidity Hours:
   - Skip trading pre/post market hours

🔹 Avoid News Events:
   - Skip trading around economic announcements
```

---

## الإشعارات | Notifications

### إعداد Telegram | Telegram Setup

```
العربية:

1. اختر لغة الإشعارات:
   🇺🇸 English
   🇸🇦 العربية

2. أنواع الإشعارات:
   ✅ فتح صفقة
   ✅ إغلاق صفقة
   ✅ التنبيهات السعرية
   ✅ التقارير اليومية
   ✅ تحذيرات المخاطر

3. ساعات الهدوء:
   - حدد أوقات عدم الإزعاج
   - مثال: 22:00 - 08:00
```

```
English:

1. Choose notification language:
   🇺🇸 English
   🇸🇦 العربية

2. Notification types:
   ✅ Trade opened
   ✅ Trade closed
   ✅ Price alerts
   ✅ Daily reports
   ✅ Risk warnings

3. Quiet hours:
   - Set do-not-disturb times
   - Example: 22:00 - 08:00
```

### نموذج رسالة Telegram | Telegram Message Sample

```
📈 صفقة جديدة مفتوحة

📊 الرمز: SPX
🎯 الاتجاه: صعود (CALL)
📦 الكمية: 5 عقود
📍 الاسترايك: 5830
💰 سعر الدخول: $350.00
📐 الدلتا: 0.350

⏰ الوقت: 2024/01/15 10:30

🤖 بوت التداول الاحترافي
```

---

## سجل الصفقات | Trade History

### العربية

**الفلاتر المتاحة:**
- التاريخ: من - إلى
- الحالة: مفتوحة، مغلقة، ملغاة
- الاتجاه: CALL، PUT
- النتيجة: رابحة، خاسرة

**التصدير:**
- تصدير CSV لجميع الصفقات
- تقرير PDF للأداء

### English

**Available Filters:**
- Date: from - to
- Status: open, closed, cancelled
- Direction: CALL, PUT
- Result: winning, losing

**Export:**
- CSV export for all trades
- PDF performance report

---

## التحليلات | Analytics

### تحليل المحفظة | Portfolio Analysis

```
العربية:

📊 الرسوم البيانية:
   - منحنى رأس المال
   - توزيع الصفقات
   - الأداء الشهري

📈 المقاييس:
   - نسبة الفوز
   - معامل الربح
   - نسبة شارب
   - أقصى تراجع
```

```
English:

📊 Charts:
   - Equity curve
   - Trade distribution
   - Monthly performance

📈 Metrics:
   - Win rate
   - Profit factor
   - Sharpe ratio
   - Max drawdown
```

### تحليل AI | AI Analysis

```
العربية:

🤖 أنواع التحليل:
   1. تحليل سريع - نظرة عامة
   2. تحليل الأداء - نقاط القوة والضعف
   3. تحليل السوق - فرص وتوصيات
   4. تحليل المخاطر - تقييم شامل

💬 اسأل AI:
   - أسئلة مخصصة حول تداولك
   - نصائح مبنية على أدائك
```

```
English:

🤖 Analysis Types:
   1. Quick Analysis - Overview
   2. Performance Analysis - Strengths & weaknesses
   3. Market Analysis - Opportunities & recommendations
   4. Risk Analysis - Comprehensive assessment

💬 Ask AI:
   - Custom questions about your trading
   - Tips based on your performance
```

---

## النسخ الاحتياطي | Backup

### العربية

```
نوع النسخة الاحتياطية:
┌────────────────────────────────────┐
│ 📦 نسخة كاملة                      │
│    - جميع البيانات والإعدادات      │
│                                    │
│ ⚙️ الإعدادات فقط                   │
│    - إعدادات البوت والتريدينج      │
│                                    │
│ 📊 الصفقات فقط                     │
│    - سجل الصفقات والتاريخ          │
└────────────────────────────────────┘

🔄 النسخ التلقائي:
   - كل 6/12/24 ساعة
   - إرسال إلى Telegram
```

### English

```
Backup Type:
┌────────────────────────────────────┐
│ 📦 Full Backup                     │
│    - All data and settings         │
│                                    │
│ ⚙️ Settings Only                   │
│    - Bot and trading settings      │
│                                    │
│ 📊 Trades Only                     │
│    - Trade history and records     │
└────────────────────────────────────┘

🔄 Auto Backup:
   - Every 6/12/24 hours
   - Send to Telegram
```

---

## استكشاف الأخطاء | Troubleshooting

### العربية

| المشكلة | الحل |
|---------|------|
| **IB غير متصل** | تأكد من تشغيل TWS/Gateway وفعل API |
| **لم تصل إشعار Telegram** | تحقق من Token و Chat ID |
| **الصفقات لا تنفذ** | تحقق من الرصيد وحدود IB |
| **سبريد عالي** | الصفقة مرفوضة للحماية، انتظر |
| **البوت متوقف** | تحقق من سجل الأخطاء |
| **فقدان الاتصال** | البوت يحاول إعادة الاتصال تلقائياً |

### English

| Issue | Solution |
|-------|----------|
| **IB not connected** | Ensure TWS/Gateway is running with API enabled |
| **Telegram notification not received** | Check Token and Chat ID |
| **Trades not executing** | Check balance and IB limits |
| **High spread** | Trade rejected for protection, wait |
| **Bot stopped** | Check error logs |
| **Connection lost** | Bot attempts auto-reconnect |

---

## Webhook من TradingView | TradingView Webhook

### صيغة الإشارة | Signal Format

```json
{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "quantity": 1,
  "stopLoss": 300,
  "takeProfit": 500,
  "strategy": "MyStrategy"
}
```

### العربية

```
إعداد Webhook في TradingView:
1. افتح استراتيجيتك
2. اضغط على "Add Alert"
3. اختر "Webhook URL"
4. أدخل: https://your-bot-url/api/webhook/tradingview
5. الصق رسالة JSON أعلاه
```

### English

```
Setup Webhook in TradingView:
1. Open your strategy
2. Click "Add Alert"
3. Select "Webhook URL"
4. Enter: https://your-bot-url/api/webhook/tradingview
5. Paste the JSON message above
```

---

## نصائح مهمة | Important Tips

### العربية

⚠️ **تحذيرات مهمة:**
- اختبر على حساب Paper أولاً
- لا تستثمر أكثر مما تستطيع خسارته
- راقب البوت بانتظام
- استخدم وقف الخسارة دائماً

💡 **نصائح للنجاح:**
- ابدأ بمبالغ صغيرة
- حدد أهداف واقعية
- تعلم من الأخطاء
- استخدم الوضع الذكي

### English

⚠️ **Important Warnings:**
- Test on Paper account first
- Don't invest more than you can lose
- Monitor the bot regularly
- Always use stop loss

💡 **Success Tips:**
- Start with small amounts
- Set realistic goals
- Learn from mistakes
- Use Smart Mode

---

## الدعم الفني | Technical Support

```
📧 Email: support@tradingbotpro.com
📱 Telegram: @TradingBotProSupport
🌐 Website: https://tradingbotpro.com

⏰ ساعات الدعم | Support Hours:
السبت - الخميس | Sat - Thu: 9:00 - 17:00 EST
```

---

**تم التحديث: | Last Updated:** 2024

**الإصدار | Version:** 2.0.0
