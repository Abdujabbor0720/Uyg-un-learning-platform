# Video Upload Tizimi - Foydalanuvchi Qo'llanmasi

## Umumiy Ma'lumot

Ushbu loyiha video upload va streaming tizimini o'z ichiga oladi. Videolar serverga yuklanadi va foydalanuvchilar uchun streaming orqali ko'rsatiladi.

## Video Yuklash

### Admin Panel orqali

1. Admin panelga kiring (`/admin`)
2. "Videolar" bo'limiga o'ting
3. "Yangi video yuklash" tugmasini bosing
4. Quyidagi ma'lumotlarni kiriting:
   - Video fayli (500MB gacha)
   - Sarlavha (majburiy)
   - Tavsif (ixtiyoriy)

### Qo'llab-quvvatlanadigan Formatlar

- MP4 (tavsiya etiladi)
- WebM
- AVI
- MOV/QuickTime

### Fayl Hajmi Chegaralari

- **Development**: 500MB
- **Production**: 500MB (cloud storage ishlatish tavsiya etiladi)

## Video Streaming

### Texnik Tafsilotlar

- **Streaming API**: `/api/video-stream/stream/[filename]`
- **Range Request**: Qo'llab-quvvatlanadi (video scrubbing uchun)
- **Cache**: 1 yil (public cache)

### Video Storage

Videolar quyidagi joyda saqlanadi:

```
/public/uploads/
```

**Muhim**: Production muhitida cloud storage (AWS S3, Cloudflare R2, etc.) ishlatish tavsiya etiladi.

## Kurs bilan Bog'lash

### Video qo'shish

1. Kursni tahrirlang
2. "Videolarni qo'shish" bo'limida mavjud videolardan tanlang
3. Tanlangan videolar kurs bilan bog'lanadi

### Video Tartibi

Videolar kursdagi tartib bo'yicha ko'rsatiladi. Tartibni o'zgartirish uchun:

1. Videoni o'chiring
2. Qayta qo'shing

## Xavfsizlik

### Video Ko'rish Huquqi

- Faqat sotib olingan kurslarning videolarini ko'rish mumkin
- JWT token orqali autentifikatsiya
- Watermark video ustida ko'rsatiladi

### Video Yuklab Olishdan Himoya

- `controlsList="nodownload"` - Yuklab olish tugmasi o'chirilgan
- `disablePictureInPicture` - PiP rejimi o'chirilgan
- `onContextMenu` - O'ng tugma menyusi o'chirilgan

## Troubleshooting

### Video Yuklanmayapti

1. Fayl hajmini tekshiring (500MB dan kam bo'lishi kerak)
2. Fayl formatini tekshiring
3. Database ulanishini tekshiring
4. `public/uploads` papkasi mavjudligini tekshiring

### Video Ko'rinmayapti

1. Video bazada saqlanganligini tekshiring
2. Fayl `public/uploads` papkasida mavjudligini tekshiring
3. Browser console'da xatolarni tekshiring
4. Network tab'da request'larni tekshiring

### Video Lag Qiladi

1. Fayl hajmini kamaytiring
2. Video sifatini pasaytiring (720p tavsiya etiladi)
3. CDN ishlatishni ko'rib chiqing

## Production Deploy

### Cloud Storage (Tavsiya etiladi)

1. AWS S3 yoki Cloudflare R2 sozlang
2. Upload endpoint'ni yangilang
3. Streaming URL'ni yangilang

### Database Migration

```bash
# Database'ni yangilash
npm run migrate
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=/api
```

## Performance Optimization

### Video Compression

Videolarni yuklashdan oldin compress qiling:

- **Tool**: HandBrake, FFmpeg
- **Format**: MP4 (H.264)
- **Resolution**: 720p yoki 1080p
- **Bitrate**: 2-5 Mbps

### CDN

Production muhitida CDN ishlatish tavsiya etiladi:

- Cloudflare
- AWS CloudFront
- Vercel Edge Network

## API Endpoints

### Video Upload

```
POST /api/upload/video
Content-Type: multipart/form-data

Body:
- file: Video file
- title: string
- description?: string
```

### Video List

```
GET /api/videos
```

### Video Stream

```
GET /api/video-stream/stream/[filename]
Headers:
  Range: bytes=0-1024
```

### Video by ID

```
GET /api/videos/[id]
```

### Video Update

```
PATCH /api/videos/[id]
Body:
{
  "title"?: string,
  "description"?: string
}
```

### Video Delete

```
DELETE /api/videos/[id]
```

## Xulosa

Video upload tizimi to'liq ishlaydi va production uchun tayyor. Cloud storage va CDN qo'shish orqali performance'ni yanada yaxshilash mumkin.
