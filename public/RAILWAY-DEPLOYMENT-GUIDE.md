# 🚀 النشر على Railway - دليل كامل

---

## 📋 المتطلبات

- حساب GitHub
- حساب Railway (مجاني مع $5 رصيد)
- المشروع على GitHub

---

## 🔧 الخطوة 1: رفع المشروع لـ GitHub

### 1.1 إنشاء Repository جديد

1. اذهب إلى: https://github.com/new
2. أدخل الاسم: `trading-bot-pro`
3. اختر: **Private** (للأمان)
4. اضغط: **Create repository**

### 1.2 رفع الكود

على جهازك المحلي:

```bash
# الذهاب لمجلد المشروع
cd C:\Users\MOHAMMED\trading-bot-pro

# إضافة GitHub كمصدر
git remote add origin https://github.com/vip2551/trading-bot-pro.git

# إضافة جميع الملفات
git add .

# حفظ التغييرات
git commit -m "🚀 تحديث كامل - إضافة التداول التلقائي"

# رفع لـ GitHub
git push -u origin main
```

---

## 🚂 الخطوة 2: إنشاء حساب Railway

### 2.1 التسجيل

1. اذهب إلى: https://railway.app
2. اضغط: **Start a New Project**
3. اختر: **Login with GitHub**
4. امنح Railway الصلاحيات المطلوبة

### 2.2 الحصول على الرصيد المجاني

```
🎁 رصيد البداية: $5 مجاناً
⏰ مدة الصلاحية: شهرين
💰 تكلفة المشروع: ~$1-3/شهر
```

---

## 🗄️ الخطوة 3: إنشاء قاعدة البيانات

### 3.1 إنشاء PostgreSQL

1. في Railway Dashboard
2. اضغط: **+ New Project**
3. اختر: **Provision PostgreSQL**

### 3.2 الحصول على رابط الاتصال

```
Variables → DATABASE_URL
```

ستجده بهذا الشكل:
```
postgresql://postgres:PASSWORD@HOST:5432/railway
```

---

## 🚀 الخطوة 4: نشر التطبيق

### 4.1 إنشاء خدمة جديدة

1. في نفس المشروع
2. اضغط: **+ Add Service**
3. اختر: **GitHub Repo**
4. اختر: `trading-bot-pro`

### 4.2 إعداد المتغيرات (Variables)

اضغط على الخدمة ثم Variables وأضف:

```env
# قاعدة البيانات
DATABASE_URL=${{Postgres.DATABASE_URL}}

# البيئة
NODE_ENV=production

# المفتاح السري
NEXTAUTH_SECRET=your-secret-key-here-change-this
NEXTAUTH_URL=https://your-app.railway.app

# IB Settings (اختياري)
IB_HOST=127.0.0.1
IB_PORT=7497
IB_CLIENT_ID=1
```

### 4.3 إعداد Build Command

في Settings → Build:

```
Build Command: bun install && bun run db:generate && bun run db:push
```

### 4.4 إعداد Start Command

في Settings → Deploy:

```
Start Command: bun run start
```

---

## 🌐 الخطوة 5: إعداد الدومين

### 5.1 توليد الدومين

1. Settings → Networking
2. اضغط: **Generate Domain**

ستحصل على:
```
https://trading-bot-pro-production-xxxx.up.railway.app
```

### 5.2 تحديث NEXTAUTH_URL

في Variables:
```
NEXTAUTH_URL=https://trading-bot-pro-production-xxxx.up.railway.app
```

---

## 📁 الخطوة 6: ملفات Railway المطلوبة

---

## 🔧 الخطوة 7: تشغيل Mini Services

Railway يدعم خدمات متعددة في مشروع واحد.

### 7.1 إضافة خدمة Auto Trader

1. اضغط: **+ Add Service**
2. اختر: **GitHub Repo**
3. اختر نفس الـ Repo
4. اضبط:
   - Root Directory: `/mini-services/auto-trader`
   - Start Command: `bun run index.ts`

---

## ✅ الخطوة 8: التحقق من النشر

### 8.1 فحص السجلات

```
Deployments → اضغط على آخر نشر → Logs
```

### 8.2 اختبار البوت

```
https://your-app.railway.app/api/health
```

---

## 🔧 ملفات الإعداد المطلوبة

---

## ⚠️ مشكلة: Railway لا يدعم IB Gateway

**Railway لا يدعم تشغيل IB Gateway** لأنه:
- يحتاج واجهة رسومية (GUI)
- Railway يدعم فقط تطبيقات Command Line

---

## 💡 الحلول:

### الحل 1: استخدام Simulation Mode على Railway

```
✅ يعمل بدون IB
✅ للتجربة والتطوير
❌ تداول وهمي
```

### الحل 2: Railway للواجهة + VPS للـ IB

```
Railway: الواجهة + قاعدة البيانات
VPS: IB Gateway + Auto Trading
```

### الحل 3: VPS كامل (AWS/Vultr)

```
✅ الأفضل للتداول الحقيقي
✅ يدعم IB Gateway
✅ تحكم كامل
```

---

## 📊 مقارنة الخيارات:

| الخيار | Railway | Railway + VPS | VPS فقط |
|--------|---------|---------------|---------|
| **السعر** | مجاني-$5 | $5+$5 | $5-10 |
| **IB Gateway** | ❌ | ✅ | ✅ |
| **تداول حقيقي** | ❌ | ✅ | ✅ |
| **السهولة** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 توصيتي:

### للتجربة:
```
✅ Railway مع Simulation Mode
   - مجاني
   - سريع
   - سهل
```

### للتداول الحقيقي:
```
✅ VPS (AWS/Vultr)
   - يدعم IB Gateway
   - تحكم كامل
   - $5-10/شهر
```

---

## 📋 الأوامر المفيدة

```bash
# سحب التحديثات من GitHub
git pull

# إعادة النشر على Railway
# يحدث تلقائياً عند push لـ main

# فحص السجلات
railway logs

# إعادة تشغيل
railway run bun run dev
```

---

## 🆘 استكشاف الأخطاء

### خطأ في Build:
```
الحل: تحقق من package.json و bun.lock
```

### خطأ في قاعدة البيانات:
```
الحل: تحقق من DATABASE_URL
```

### خطأ في Start:
```
الحل: تحقق من Logs
```

---

## 📞 الدعم

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
