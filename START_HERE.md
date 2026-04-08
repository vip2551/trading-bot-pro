# 🚀 Trading Bot Pro - تشغيل المشروع

## ⚡ التشغيل السريع

### 1. المتطلبات
- تثبيت [Bun](https://bun.sh) على جهازك
- Windows 10/11

### 2. خطوات التشغيل

```bash
# 1. فك ضغط الملف
# 2. فتح المجلد في Terminal

# 3. تثبيت المكتبات
bun install

# 4. إعداد قاعدة البيانات
bun run db:push

# 5. تشغيل التطبيق
bun run dev
```

### 3. فتح المتصفح
```
http://localhost:3000
```

## 🔧 حل المشاكل الشائعة

### الشاشة البيضاء
إذا ظهرت شاشة بيضاء:
1. تأكد من تشغيل `bun run db:push` قبل `bun run dev`
2. تحقق من عدم وجود أخطاء في Terminal
3. حاول تحديث الصفحة بالضغط على Ctrl+Shift+R

### المنفذ 3000 مستخدم
```bash
# Windows: إغلاق العملية التي تستخدم المنفذ
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### مشاكل المكتبات
```bash
# حذف وإعادة تثبيت المكتبات
rm -rf node_modules
rm bun.lock
bun install
```

## 📁 هيكل المشروع

```
trading-bot-pro/
├── src/
│   ├── app/
│   │   ├── page.tsx          # الصفحة الرئيسية
│   │   ├── layout.tsx        # التخطيط الأساسي
│   │   ├── globals.css       # الأنماط
│   │   └── api/              # واجهات API
│   ├── components/           # مكونات React
│   └── lib/                  # المكتبات المساعدة
├── prisma/
│   └── schema.prisma         # هيكل قاعدة البيانات
├── db/
│   └── custom.db             # قاعدة البيانات (SQLite)
├── mini-services/            # خدمات إضافية
│   ├── ib-service/           # خدمة Interactive Brokers
│   └── trade-monitor/        # مراقب الصفقات
└── package.json
```

## 🎯 الاستخدام

1. **تشغيل البوت**: اضغط على زر "تشغيل"
2. **الصفقات اليدوية**: تبويب "يدوي"
3. **إعدادات الاسترايك**: تبويب "الاسترايك"
4. **الاتصال بـ IB**: تبويب "الاتصال"
5. **إشعارات Telegram**: تبويب "الإشعارات"

## 🌐 Webhook من TradingView

استخدم هذا الرابط في تنبيهات TradingView:
```
http://your-server/api/webhook/tradingview
```

صيغة الرسالة:
```json
{
  "action": "CALL",
  "symbol": "SPX",
  "price": 5000,
  "quantity": 1
}
```

## 📱 Telegram Bot

1. أنشئ بوت جديد عبر [@BotFather](https://t.me/botfather)
2. انسخ الـ Token
3. احصل على Chat ID عبر [@userinfobot](https://t.me/userinfobot)
4. أدخل البيانات في تبويب "الإشعارات"

## 🔐 Interactive Brokers

1. افتح TWS أو IB Gateway
2. فعّل API Connections:
   - Configure → API → Settings
   - Enable ActiveX and Socket Clients
   - Socket port: 7497 (TWS Paper) أو 7496 (TWS Live)
3. أدخل الإعدادات في تبويب "الاتصال"

## ✨ الميزات

- ✅ واجهة عربية كاملة
- ✅ تكامل مع Interactive Brokers
- ✅ Webhook من TradingView
- ✅ إشعارات Telegram
- ✅ إدارة المخاطر
- ✅ تتبع الصفقات
- ✅ أوضاع استرايك متعددة
- ✅ وضع تجريبي (Demo)

## 🆘 الدعم

إذا واجهت أي مشكلة:
1. راجع هذا الملف
2. تأكد من إكمال جميع الخطوات بالترتيب
3. تحقق من سجل الأخطاء في Terminal
