# Backend Arxitektura - Tushuntirish

## Muammo

Loyihada **2 ta backend tizim** bor edi:

### 1. Next.js API Routes (Port 3000)

- Joylashuvi: `/app/api/`
- Upload papkasi: `/public/uploads/`
- Database: PostgreSQL (lib/postgres.ts)

### 2. NestJS Backend (Port 5000)

- Joylashuvi: `/client/src/`
- Upload papkasi: `/client/uploads/`
- Database: TypeORM + PostgreSQL

## Hal qilingan Yechim

Biz **Next.js API Routes** dan foydalanamiz, chunki:

1. Frontend allaqachon `/api` dan foydalanadi
2. Sodda va to'g'ridan-to'g'ri integratsiya
3. Vercel deploy uchun qulay

## O'zgarishlar

### 1. Video Storage

```
client/uploads/*.mp4  →  public/uploads/*.mp4
```

Videolar endi `/public/uploads/` da saqlanadi va Next.js orqali serve qilinadi.

### 2. API Endpoints

#### Video Upload

```
POST /api/upload/video
- File: multipart/form-data
- Max size: 500MB
- Formats: MP4, WebM, AVI, MOV
```

#### Video Streaming

```
GET /api/video-stream/stream/[filename]
- Range request support
- Optimized for large files
```

#### Video List

```
GET /api/videos
- Returns all videos with metadata
```

### 3. Database Schema

```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,  -- Faqat fayl nomi
  url VARCHAR(500) NOT NULL,        -- Filename bilan bir xil
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## NestJS Backend (Opsional)

Agar NestJS backend kerak bo'lsa:

### 1. Start NestJS

```bash
cd client
npm run start:dev  # Port 5000
```

### 2. Frontend API'ni o'zgartirish

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: "http://localhost:5000", // NestJS backend
  withCredentials: true,
});
```

### 3. CORS sozlash

```typescript
// client/src/main.ts
app.enableCors({
  origin: "http://localhost:3000",
  credentials: true,
});
```

## Tavsiya

**Production uchun**:

- Next.js API Routes ishlatish (hozirgi holat) ✅
- Cloud storage (AWS S3 / Cloudflare R2)
- CDN (Cloudflare / AWS CloudFront)

**Development uchun**:

- Lokal storage (`public/uploads/`) ✅
- PostgreSQL database

## Fayllar Tuzilmasi

```
project/
├── app/
│   ├── api/                    # Next.js API Routes ✅
│   │   ├── upload/video/
│   │   ├── videos/
│   │   └── video-stream/
│   └── admin/                  # Frontend
│
├── client/                     # NestJS Backend (ishlatilmaydi)
│   ├── src/
│   └── uploads/               # Eski videolar (ko'chirildi)
│
├── public/
│   └── uploads/               # Yangi video storage ✅
│
└── lib/
    ├── api.ts                 # Axios config → /api
    └── postgres.ts            # Database operations ✅
```

## Migration Qadamlari

### Mavjud videolarni ko'chirish:

```bash
cp client/uploads/*.mp4 public/uploads/
```

### Database yangilash:

```sql
UPDATE videos SET url = filename WHERE url LIKE '/uploads/%';
```

### Test:

1. Admin panelda video yuklash
2. Video list'ni ko'rish
3. Kurs sahifasida video o'ynash

## Xulosa

✅ Faqat Next.js API Routes ishlatamiz
✅ Videolar public/uploads/ da
✅ Database to'g'ri ishlaydi
✅ Streaming optimallashtirilgan
✅ Production ready

NestJS backend `/client/` papkasida qoladi, lekin ishlatilmaydi.
