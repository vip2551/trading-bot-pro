# 🚀 تشغيل Trading Bot محلياً مع Interactive Brokers

## المتطلبات:
- Node.js 18+ أو Bun
- TWS أو IB Gateway مفتوح

## خطوات التشغيل:

### 1. تثبيت الحزم
```bash
bun install
# أو
npm install
```

### 2. تهيئة قاعدة البيانات
```bash
bun run db:push
# أو
npx prisma db push
npx prisma generate
```

### 3. إنشاء ملف .env
```env
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=your-secret-key-here-change-it
NEXTAUTH_URL=http://localhost:3000
```

### 4. تشغيل الخادم
```bash
bun run dev
# أو
npm run dev
```

### 5. فتح المتصفح
```
http://localhost:3000
```

## إعداد Interactive Brokers:

### Paper Trading:
- Host: 127.0.0.1
- Port: 7497
- Client ID: 1

### Live Trading:
- Host: 127.0.0.1
- Port: 7496
- Client ID: 1

## تفعيل API في TWS:
1. File → Global Configuration
2. API → Settings
3. ✅ Enable ActiveX and Socket Clients
4. ✅ Allow connections from localhost
5. Socket port: 7497 (Paper) أو 7496 (Live)

## بيانات الدخول:
- Email: vip25@hotmail.com
- Password: MR423mr
- Plan: ENTERPRISE (Unlimited)
- Admin: YES

## الميزات:
- ✅ تداول آلي مع TradingView Webhooks
- ✅ تتبع الحيتان بالذكاء الاصطناعي
- ✅ إشعارات Telegram
- ✅ تقارير الضرائب
- ✅ محاكاة التداول
- ✅ دعم اللغة العربية
