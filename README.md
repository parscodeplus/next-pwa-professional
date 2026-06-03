
```markdown
# Next.js PWA Professional

یک پکیج حرفه‌ای برای افزودن قابلیت PWA و پشتیبانی آفلاین به پروژه‌های Next.js

## ✨ ویژگی‌ها

- ✅ پشتیبانی کامل از App Router
- ✅ کار با Webpack و Turbopack
- ✅ مدیریت آفلاین پیشرفته با IndexedDB
- ✅ همگام‌سازی خودکار پس از بازگشت اینترنت
- ✅ UI/UX الهام گرفته از پلتفرم‌های موفق
- ✅ پشتیبانی از TypeScript
- ✅ قابلیت نصب به عنوان PWA
- ✅ کش هوشمند صفحات و API

## 📦 نصب

```bash
npm install next-pwa-professional
```

🚀 شروع سریع

1. اضافه کردن Provider در layout.tsx

```tsx
// app/layout.tsx
import { PWAProvider } from 'next-pwa-professional';

export default function RootLayout({ children }) {
  return (
    <html lang="fa">
      <body>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
```

2. Build و تست

```bash
npm run build
npm start
```

📖 مستندات کامل

استفاده از آفلاین استوریج

```tsx
'use client';
import { useOfflineStorage } from 'next-pwa-professional';

function MyComponent() {
  const { pendingCount, storeAction } = useOfflineStorage();
  
  const handleSubmit = async (data) => {
    await storeAction('submit-form', data);
  };
  
  return (
    <div>
      {pendingCount > 0 && (
        <div>{pendingCount} آیتم در صف همگام‌سازی</div>
      )}
    </div>
  );
}
```

ایجاد اکشن‌های آفلاین

```tsx
import { createOfflineAction } from 'next-pwa-professional';

const submitForm = createOfflineAction('contact', async (data) => {
  const res = await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
});
```

استفاده از کش

```tsx
import { cacheManager } from 'next-pwa-professional';

// ذخیره در کش
await cacheManager.set('/api/products', products);

// بازیابی از کش
const cached = await cacheManager.get('/api/products');
```

🎨 سفارشی‌سازی

تغییر ظاهر بنر آفلاین

```tsx
<PWAProvider>
  <NetworkStatus />
  {children}
</PWAProvider>
```

تنظیمات پیشرفته

```tsx
<PWAProvider 
  swPath="/custom-sw.js"
  enableInstallPrompt={true}
  offlinePagePath="/custom-offline"
>
  {children}
</PWAProvider>
```

🧪 تست

1. Build پروژه: npm run build
2. Start server: npm start
3. در DevTools > Network > Offline
4. صفحه را رفرش کنید - باید کار کند!

📄 لایسنس

MIT

🤝 مشارکت

Pull requests خوش آمدید!

```
