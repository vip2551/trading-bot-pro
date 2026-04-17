# دليل التداول الورقي الكامل

## 📋 المتطلبات
- حساب IB ورقي (Paper Trading Account)
- IB Gateway أو TWS مثبت
- اتصال إنترنت مستقر

---

## 🔧 الخطوة 1: إعداد IB Gateway

### 1. افتح IB Gateway
```
- سجل الدخول بحسابك الورقي (Paper Trading)
- اذهب إلى: Configure → Settings → API → Settings
```

### 2. فعّل API
```
☑️ Enable ActiveX and Socket Clients
☑️ Allow connections from localhost only (ألغِ التحديد إذا أردت اتصال خارجي)
```

### 3. إعدادات المنفذ
```
Paper Trading Port: 7497
Live Trading Port: 7496 (لا تستخدمه الآن!)
```

### 4. إعدادات إضافية
```
☑️ Create API message log file
☑️ Use Read-Only API for manual orders (اختياري)
```

---

## 🖥️ الخطوة 2: تشغيل البوت

### 1. افتح Terminal في مجلد البوت
```bash
cd /home/z/my-project
```

### 2. تثبيت الحزم (إذا لم تكن مثبتة)
```bash
bun install
```

### 3. تهيئة قاعدة البيانات
```bash
bunx prisma db push
```

### 4. تشغيل البوت
```bash
bun run dev
```

### 5. سيظهر لك:
```
✓ Ready on http://localhost:3000
✓ Trade monitor running on port 3004
✓ IB service running on port 3003
```

---

## 🌐 الخطوة 3: فتح البوت

افتح المتصفح على:
```
http://localhost:3000
```

---

## 🔑 الخطوة 4: إنشاء مفتاح Webhook

### 1. اذهب للإعدادات في البوت
### 2. اضغط على "Webhook Settings"
### 3. اضغط "Generate New Secret"
### 4. انسخ المفتاح (ستحتاجه في TradingView)

أو من خلال API:
```bash
curl -X POST http://localhost:3000/api/webhook/secret \
  -H "Content-Type: application/json" \
  -d '{"name": "TradingView Webhook"}'
```

---

## 📊 الخطوة 5: إعداد TradingView

### 1. افتح TradingView
### 2. اذهب إلى الرسم البياني للسهم المطلوب (مثلاً SPX)
### 3. اضغط على "Alert" (أيقونة الجرس)

### 4. إعداد الشرط:
```
Condition: اختر الاستراتيجية أو المؤشر
           مثلاً: RSI crosses up 30
```

### 5. إعداد التنبيه:
```
Alert Actions: Webhook URL
URL: http://YOUR_NGROK_URL/api/tradingview/webhook
```

### 6. رسالة JSON:
```json
{
  "symbol": "{{ticker}}",
  "action": "BUY",
  "direction": "CALL",
  "price": {{close}},
  "quantity": 1,
  "stop_loss": 20,
  "trailing_stop": 15,
  "take_profit": 50,
  "secret": "YOUR_WEBHOOK_SECRET"
}
```

---

## 🔄 الخطوة 6: إعداد ngrok (للتداول من الإنترنت)

### 1. تثبيت ngrok (إذا لم يكن مثبتاً)
```bash
# على Ubuntu/Debian
sudo snap install ngrok

# أو على macOS
brew install ngrok
```

### 2. تشغيل ngrok
```bash
ngrok http 3000
```

### 3. انسخ الرابط الظاهر:
```
Forwarding: https://xxxx-xx-xx-xxx-xx.ngrok-free.app -> http://localhost:3000
```

### 4. استخدم هذا الرابط في TradingView:
```
https://xxxx-xx-xx-xxx-xx.ngrok-free.app/api/tradingview/webhook
```

---

## 📱 الخطوة 7: إعداد Telegram (للإشعارات)

### 1. إنشاء بوت Telegram
```
1. افتح Telegram
2. ابحث عن @BotFather
3. أرسل: /newbot
4. اتبع التعليمات
5. انسخ الـ Token
```

### 2. الحصول على Chat ID
```
1. أرسل رسالة للبوت
2. افتح: https://api.telegram.org/botYOUR_TOKEN/getUpdates
3. ابحث عن "chat":{"id":YOUR_CHAT_ID
```

### 3. إدخال البيانات في البوت
```
Settings → Telegram
- Bot Token: YOUR_BOT_TOKEN
- Chat ID: YOUR_CHAT_ID
- Enable Telegram: ☑️
```

---

## ✅ الخطوة 8: اختبار الاتصال

### 1. اختبار Webhook
```bash
curl -X POST http://localhost:3000/api/tradingview/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SPX",
    "action": "BUY",
    "direction": "CALL",
    "price": 350,
    "quantity": 1,
    "stop_loss": 20,
    "trailing_stop": 15,
    "take_profit": 50,
    "secret": "YOUR_WEBHOOK_SECRET"
  }'
```

### 2. اختبار IB Gateway
```bash
curl http://localhost:3003/health
```

### 3. اختبار Telegram
```bash
curl http://localhost:3004/health
```

---

## 📊 الخطوة 9: إضافة رموز للتداول التلقائي

### 1. اذهب لقائمة المراقبة (Watchlist)
### 2. أضف رمز جديد:
```
Symbol: SPX
Type: OPTION
Strike: (اختياري - AUTO للتحديد التلقائي)
Auto Trade: ☑️
Quantity: 1
```

---

## 🎯 أمثلة على رسائل Webhook

### صفقة CALL مع وقف متحرك:
```json
{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "price": 350,
  "quantity": 1,
  "trailing_stop": 15,
  "secret": "YOUR_SECRET"
}
```

### صفقة PUT مع وقف خسارة وجني أرباح:
```json
{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "PUT",
  "price": 350,
  "quantity": 1,
  "stop_loss": 20,
  "take_profit": 50,
  "secret": "YOUR_SECRET"
}
```

### صفقة مع كل الخيارات:
```json
{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "price": 350,
  "quantity": 2,
  "stop_loss": 25,
  "trailing_stop": 15,
  "take_profit": 75,
  "secret": "YOUR_SECRET"
}
```

---

## ⚠️ ملاحظات مهمة

1. **احتفظ بالمفتاح السري آمناً** - لا تشاركه مع أحد
2. **اختبر على حساب ورقي أولاً** - لا تستخدم حساب حقيقي حتى تتأكد
3. **راقب البوت** - تحقق من السجلات بانتظام
4. **استخدم وقف الخسارة دائماً** - لحماية رأس المال
5. **IB Gateway يجب أن يكون مفتوحاً** - طوال فترة التداول

---

## 🆘 استكشاف الأخطاء

### البوت لا يعمل:
```bash
# تحقق من السجلات
cat /home/z/my-project/dev.log

# أعد التشغيل
bun run dev
```

### IB Gateway غير متصل:
```bash
# تحقق من الاتصال
curl http://localhost:3003/health

# تأكد من إعدادات API في IB Gateway
```

### Webhook لا يعمل:
```bash
# تحقق من المفتاح السري
curl http://localhost:3000/api/webhook/secrets

# اختبر الإرسال يدوياً
curl -X POST http://localhost:3000/api/tradingview/webhook \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TEST","action":"BUY","secret":"YOUR_SECRET"}'
```

---

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. سجلات البوت: `/home/z/my-project/dev.log`
2. سجلات IB: `/home/z/my-project/mini-services/ib-service/`
3. سجلات المراقب: `/home/z/my-project/mini-services/trade-monitor/`
