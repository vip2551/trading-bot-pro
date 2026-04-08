# تحديثات البوت - كيفية الإضافة

## الملفات الجديدة (انسخها لمشروعك)

### 1. mini-services/auto-trader/index.ts
أنشئ مجلد: mini-services/auto-trader/
ثم أنشئ ملف: index.ts

### 2. mini-services/auto-trader/package.json
أنشئ ملف: package.json

### 3. src/app/api/auto-trading/route.ts
أنشئ مجلد: src/app/api/auto-trading/
ثم أنشئ ملف: route.ts

### 4. src/app/api/trading/auto-monitor/route.ts
أنشئ مجلد: src/app/api/trading/auto-monitor/
ثم أنشئ ملف: route.ts

### 5. src/app/api/trading/intelligence/route.ts
أنشئ مجلد: src/app/api/trading/intelligence/
ثم أنشئ ملف: route.ts

### 6. src/app/api/admin/init/route.ts
أنشئ مجلد: src/app/api/admin/init/
ثم أنشئ ملف: route.ts

### 7. src/app/api/auth/session/route.ts
أنشئ ملف: route.ts

### 8. src/app/api/auth/logout/route.ts
أنشئ ملف: route.ts

### 9. src/app/api/plans/promo/route.ts
أنشئ مجلد: src/app/api/plans/promo/
ثم أنشئ ملف: route.ts

### 10. src/app/admin/plans/page.tsx
أنشئ مجلد: src/app/admin/plans/
ثم أنشئ ملف: page.tsx

---

## الملفات المعدلة (استبدلها)

1. src/app/page.tsx
2. prisma/schema.prisma
3. src/app/api/settings/route.ts
4. src/app/api/telegram/route.ts
5. src/app/api/plans/route.ts
6. src/components/plans-manager.tsx

---

## بعد النسخ:

```cmd
cd C:\path\to\trading-bot-pro
npm install
npx prisma generate
npm run dev
```
