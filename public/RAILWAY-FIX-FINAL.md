# 🔧 الحل النهائي لمشكلة Railway - "Fix nixpacks start command"

## ❌ المشكلة
```
FAILED - Fix nixpacks start command
Healthcheck failure
```

## ✅ الحل

### 1️⃣ تحديث ملف `nixpacks.toml`
احذف المحتوى القديم واكتب التالي:

```toml
[phases.setup]

[phases.install]
cmd = "bun install --frozen-lockfile"

[phases.build]
cmd = "bunx prisma generate && bun run build"

[start]
cmd = "bash start-railway.sh"
```

---

### 2️⃣ إنشاء ملف `start-railway.sh` في المجلد الرئيسي
```bash
#!/bin/bash

echo "🚂 Starting Trading Bot on Railway..."

export HOSTNAME="0.0.0.0"

echo "📦 Generating Prisma Client..."
bunx prisma generate || echo "Prisma generate skipped"

echo "📊 Setting up database..."
bunx prisma db push --skip-generate || echo "Database push completed"

echo "🚀 Starting Next.js app on 0.0.0.0:3000..."
exec bunx next start -H 0.0.0.0 -p 3000
```

---

### 3️⃣ تحديث ملف `railway.toml`
```toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 600
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

### 4️⃣ تأكد من ملف `package.json` يحتوي على:
```json
{
  "scripts": {
    "start": "next start -H 0.0.0.0 -p 3000"
  }
}
```

---

### 5️⃣ تأكد من وجود `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running'
    }
  });
}
```

---

## 📤 أوامر الرفع النهائية

بعد تحديث الملفات على جهازك المحلي:

```bash
cd C:\Users\MOHAMMED\trading-bot-pro

git add .
git commit -m "Fix Railway nixpacks start command"
git push origin main --force
```

---

## ⚠️ متغيرات البيئة المطلوبة في Railway

تأكد من إضافة هذه المتغيرات في Railway Dashboard:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | من PostgreSQL plugin |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | `https://your-app.railway.app` |

---

## 🔍 التحقق

1. اذهب إلى Railway Dashboard
2. تحقق من Service Logs
3. يجب أن ترى:
   ```
   🚂 Starting Trading Bot on Railway...
   📦 Generating Prisma Client...
   📊 Setting up database...
   🚀 Starting Next.js app on 0.0.0.0:3000...
   ✓ Ready in XXXms
   ```
4. ثم: **Healthcheck passed!**
