# 🎉 SERVERLAR ISHGA TUSHIRILDI!

## ✅ Ishlab turgan Serverlar

### 🌐 Frontend (Next.js)

- **URL**: http://localhost:3000
- **Port**: 3000
- **Status**: ✅ Ishlamoqda
- **API**: `/api/*` endpoints

### 🔧 Backend (NestJS)

- **URL**: http://localhost:5000
- **Port**: 5000
- **Status**: ✅ Ishlamoqda
- **API**: REST endpoints

## 📍 Muhim URL lar

| Service         | URL                             | Description              |
| --------------- | ------------------------------- | ------------------------ |
| **Home Page**   | http://localhost:3000           | Asosiy sahifa            |
| **Admin Panel** | http://localhost:3000/admin     | Admin boshqaruvi         |
| **Auth Page**   | http://localhost:3000/auth      | Login/Register           |
| **Dashboard**   | http://localhost:3000/dashboard | Foydalanuvchi dashboardi |
| **Backend API** | http://localhost:5000           | NestJS REST API          |

## 🔐 Default Login

### Admin

- **Email**: `admin@uygunlik.uz`
- **Password**: `password`

### Test User

- **Email**: `test@uygunlik.uz`
- **Password**: `test123`

## 📦 Backend Tizim

**Hozirda ikki backend ishlayapti:**

### 1. Next.js API Routes (Primary) ✅

```
Frontend → /api/* → PostgreSQL + File Storage
```

- Video upload: `/api/upload/video`
- Video streaming: `/api/video-stream/stream/[filename]`
- CRUD operations: `/api/videos`, `/api/courses`, `/api/users`

### 2. NestJS Backend (Optional)

```
Frontend → http://localhost:5000 → SQLite/PostgreSQL
```

- REST API with TypeORM
- Video streaming: `/video-stream/stream/[filename]`
- Port: 5000

## 🎥 Video Upload Test

### Admin Panel orqali:

1. http://localhost:3000/admin ga kiring
2. Login: admin@uygunlik.uz / password
3. "Videolar" tabga o'ting
4. "Yangi video yuklash" tugmasini bosing
5. Video tanlang (500MB gacha)
6. Sarlavha va tavsif kiriting
7. "Yuklash" tugmasi

### Upload Locations:

- **Next.js API**: `/public/uploads/`
- **NestJS Backend**: `/client/uploads/`

## 🔄 Serverlarni Boshqarish

### Manual ishga tushirish:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd client && npm run start:dev
```

### Script bilan ishga tushirish:

```bash
./start-dev.sh
```

### To'xtatish:

```bash
# Ctrl+C yoki
ps aux | grep -E "(next-server|nest)" | grep -v grep | awk '{print $2}' | xargs kill
```

## 🧪 API Test

### Next.js API Routes:

```bash
# Health check
curl http://localhost:3000/api/health

# Videos list
curl http://localhost:3000/api/videos

# Upload test
curl -X POST http://localhost:3000/api/upload/video \
  -F "file=@test.mp4" \
  -F "title=Test Video" \
  -F "description=Test description"
```

### NestJS Backend:

```bash
# Health check
curl http://localhost:5000

# Videos list (requires auth)
curl http://localhost:5000/videos \
  -H "Authorization: Bearer <token>"

# Login
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uygunlik.uz","password":"password"}'
```

## 📊 Database

### PostgreSQL (Next.js API)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/uygunlik_db
```

### SQLite (NestJS - fallback)

```
client/anor.db
```

## 🔍 Troubleshooting

### Port allaqachon band bo'lsa:

```bash
# Port 3000 ni bo'shatish
lsof -ti:3000 | xargs kill -9

# Port 5000 ni bo'shatish
lsof -ti:5000 | xargs kill -9
```

### Dependencies xatosi:

```bash
# Frontend
npm install

# Backend
cd client && npm install
```

### Database xatosi:

```bash
# PostgreSQL ishga tushirish
sudo systemctl start postgresql

# Database yaratish
createdb uygunlik_db
```

## 📝 Development Workflow

### 1. Kod o'zgartirish

- Frontend: Auto-reload ✅
- Backend: Auto-reload (watch mode) ✅

### 2. Video upload test

- Admin panel orqali video yuklash
- Console'da xatolarni kuzatish
- Network tabda request'larni tekshirish

### 3. Database tekshirish

```bash
# PostgreSQL
psql -d uygunlik_db -c "SELECT * FROM videos;"

# SQLite
cd client && sqlite3 anor.db "SELECT * FROM videos;"
```

## 🚀 Production Deploy

### Next.js (Recommended)

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

### Vercel

```bash
vercel deploy
```

## 📚 Dokumentatsiya

- **SOLUTION_SUMMARY.md** - Muammolar va yechimlar
- **BACKEND_ARCHITECTURE.md** - Backend arxitektura
- **VIDEO_UPLOAD_GUIDE.md** - Video upload qo'llanma
- **VIDEO_UPLOAD_CHANGES.md** - O'zgarishlar ro'yxati

## ✅ Status Summary

| Component        | Status     | Port | Notes                    |
| ---------------- | ---------- | ---- | ------------------------ |
| Next.js Frontend | ✅ Running | 3000 | Primary frontend         |
| Next.js API      | ✅ Running | 3000 | `/api/*` endpoints       |
| NestJS Backend   | ✅ Running | 5000 | Alternative API          |
| PostgreSQL       | ⚠️ Check   | 5432 | Required for Next.js API |
| File Storage     | ✅ Ready   | -    | `/public/uploads/`       |

## 🎯 Next Steps

1. ✅ Test video upload in admin panel
2. ✅ Create test course with videos
3. ✅ View course and test video streaming
4. ✅ Check responsive design
5. ✅ Test user registration and purchase flow

**Barcha tizimlar ishlamoqda va test qilishga tayyor!** 🎉
