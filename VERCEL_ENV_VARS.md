# Vercel Environment Variables

## Frontend uchun (Vercel Dashboard > Settings > Environment Variables)

### Production Environment Variables:

```
NEXT_PUBLIC_API_URL = /api
NEXT_PUBLIC_APP_NAME = Uygunlik Learning Platform
NODE_ENV = production
JWT_SECRET = your_very_secure_jwt_secret_key_here
DATABASE_URL = postgresql://username:password@host:port/database_name
```

### Preview Environment Variables (ixtiyoriy):

```
NEXT_PUBLIC_API_URL = /api
NEXT_PUBLIC_APP_NAME = Uygunlik Learning Platform (Staging)
NODE_ENV = development
JWT_SECRET = your_very_secure_jwt_secret_key_here
```

### Development Environment Variables (ixtiyoriy):

```
NEXT_PUBLIC_API_URL = /api
NEXT_PUBLIC_APP_NAME = Uygunlik Learning Platform (Local)
NODE_ENV = development
JWT_SECRET = your_very_secure_jwt_secret_key_here
```

## Vercel'da qo'shish yo'li:

1. **Vercel Dashboard** ga kiring
2. Loyihangizni tanlang
3. **Settings** > **Environment Variables** ga o'ting
4. Har bir variable uchun:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `/api`
   - **Environment**: Production (va Preview/Development kerak bo'lsa)
   
   - **Name**: `JWT_SECRET`
   - **Value**: `your_very_secure_jwt_secret_key_here`
   - **Environment**: Production (va Preview/Development kerak bo'lsa)

## Muhim eslatmalar:

- `NEXT_PUBLIC_` bilan boshlangan o'zgaruvchilar frontend'da foydalanish mumkin
- Backend API URL'ni to'g'ri ko'rsating
- Har xil muhitlar uchun turli URL'lar ishlatishingiz mumkin
- Production'da HTTPS ishlatishni unutmang

## Qo'shimcha sozlamalar:

Agar boshqa environment variables kerak bo'lsa:

```
NEXT_PUBLIC_APP_VERSION = 1.0.0
NEXT_PUBLIC_ANALYTICS_ID = your_analytics_id
NEXT_PUBLIC_SENTRY_DSN = your_sentry_dsn
```
