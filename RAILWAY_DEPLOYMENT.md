# 🚂 Railway Deployment Guide

## دليل نشر البوت على Railway

---

## 📋 المتطلبات

1. حساب على [Railway](https://railway.app)
2. حساب GitHub (لربط المشروع)
3. مفتاح Telegram Bot (اختياري)

---

## 🔧 الخطوة 1: رفع المشروع إلى GitHub

### 1. إنشاء مستودع جديد
```
1. اذهب إلى github.com
2. اضغط "New Repository"
3. اسم المستودع: trading-bot
4. اجعله Private للأمان
```

### 2. رفع الكود
```bash
cd /home/z/my-project
git init
git add .
git commit -m "Initial commit - Trading Bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trading-bot.git
git push -u origin main
```

---

## 🚀 الخطوة 2: إنشاء مشروع على Railway

### 1. اذهب إلى [Railway](https://railway.app)
### 2. اضغط "New Project"
### 3. اختر "Deploy from GitHub repo"
### 4. اختر مستودع البوت

---

## 🗄️ الخطوة 3: إضافة قاعدة البيانات

### 1. في مشروع Railway، اضغط "+ New"
### 2. اختر "Database" → "PostgreSQL"
### 3. سيتم إنشاء قاعدة بيانات تلقائياً

---

## ⚙️ الخطوة 4: إعداد المتغيرات البيئية

اضغط على خدمة البوت ثم "Variables" وأضف:

```env
# Database (يُضاف تلقائياً من PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here-use-openssl-rand-hex-32
NEXTAUTH_URL=https://your-app.up.railway.app

# Telegram (اختياري)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# IB Gateway (للتداول الحقيقي)
IB_HOST=127.0.0.1
IB_PORT=7497
IB_CLIENT_ID=1
ACCOUNT_TYPE=PAPER

# Bot Settings
DEFAULT_QUANTITY=1
MAX_RISK_PER_TRADE=100
```

---

## 🔄 الخطوة 5: إعداد أمر التشغيل

Railway سيستخدم الأمر من `railway.toml`:

```toml
[deploy]
startCommand = "bun run start:railway"
```

أو يمكنك تعيينه يدوياً في Variables:
```
RAILWAY_START_COMMAND=bash start-railway.sh
```

---

## 🌐 الخطوة 6: الحصول على رابط البوت

### 1. اذهب إلى "Settings" في خدمة البوت
### 2. اضغط "Generate Domain"
### 3. ستحصل على رابط مثل:
```
https://trading-bot-production-xxx.up.railway.app
```

---

## 🔑 الخطوة 7: إنشاء Webhook Secret

### بعد تشغيل البوت، اذهب إلى الرابط:
```
https://your-app.up.railway.app/api/webhook/secret
```

أو استخدم curl:
```bash
curl -X POST https://your-app.up.railway.app/api/webhook/secret
```

---

## 📊 الخطوة 8: ربط TradingView

### 1. في TradingView، اذهب إلى Alert
### 2. في Webhook URL ضع:
```
https://your-app.up.railway.app/api/tradingview/webhook
```

### 3. في Message ضع:
```json
{
  "symbol": "{{ticker}}",
  "action": "BUY",
  "direction": "CALL",
  "price": {{close}},
  "quantity": 1,
  "trailing_stop": 15,
  "secret": "YOUR_WEBHOOK_SECRET"
}
```

---

## ⚠️ ملاحظات مهمة

### 1. Mini Services على Railway
الـ mini services تعمل داخل نفس الحاوية مع البوت الرئيسي.

### 2. IB Gateway خارج Railway
Railway لا يدعم تشغيل IB Gateway داخله. للحل:

**الخيار A: تشغيل IB Gateway محلياً**
- شغّل IB Gateway على جهازك
- استخدم ngrok للوصول إليه من Railway

**الخيار B: VPS منفصل**
- استخدم VPS لتشغيل IB Gateway
- اربط البوت به عبر IP عام

**الخيار C: Paper Trading بدون IB**
- استخدم نظام Paper Trading المدمج
- لا يحتاج IB Gateway

### 3. تكلفة Railway
- الخطة المجانية: $5/شهر
- المشروع يستهلك حوالي $3-5/شهر

---

## 🧪 اختبار البوت

### 1. Health Check
```bash
curl https://your-app.up.railway.app/api/health
```

### 2. Webhook Test
```bash
curl -X POST https://your-app.up.railway.app/api/tradingview/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "SPX",
    "action": "BUY",
    "direction": "CALL",
    "price": 350,
    "secret": "YOUR_SECRET"
  }'
```

---

## 📱 المتغيرات المطلوبة

| المتغير | مطلوب | وصف |
|---------|-------|-----|
| `DATABASE_URL` | ✅ | يُضاف تلقائياً |
| `NEXTAUTH_SECRET` | ✅ | مفتاح التشفير |
| `NEXTAUTH_URL` | ✅ | رابط البوت |
| `TELEGRAM_BOT_TOKEN` | ❌ | توكن البوت |
| `TELEGRAM_CHAT_ID` | ❌ | معرف المحادثة |

---

## 🆘 استكشاف الأخطاء

### البوت لا يعمل:
1. تحقق من Logs في Railway
2. تأكد من DATABASE_URL
3. تحقق من NEXTAUTH_URL

### قاعدة البيانات:
```bash
# تشغيل Migration
railway run bunx prisma db push
```

### إعادة النشر:
```
Railway → Deployments → Redeploy
```

---

## ✅ قائمة التحقق

- [ ] المشروع مرفوع على GitHub
- [ ] مشروع Railway مُنشأ
- [ ] PostgreSQL مُضاف
- [ ] المتغيرات مُعدة
- [ ] Domain مُنشأ
- [ ] Webhook Secret محفوظ
- [ ] TradingView مُربوط
- [ ] Telegram مُفعل (اختياري)
