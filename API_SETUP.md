# API Sozlamalari

## Backend API URL ni o'zgartirish

Real backend server bilan ishlash uchun quyidagi fayllarda BACKEND_URL ni o'zgartiring:

### 1. Environment Variables (.env.local fayli yarating)

```
BACKEND_URL=http://localhost:8000/api
```

Yoki production uchun:
```
BACKEND_URL=https://your-backend-domain.com/api
```

### 2. O'zgartirilgan API Endpoints

- **Login:** `POST /api/users/login` → Backend: `${BACKEND_URL}/auth/login`
- **Register:** `POST /api/users/register` → Backend: `${BACKEND_URL}/auth/register`  
- **User Info:** `GET /api/users/me` → Backend: `${BACKEND_URL}/auth/me`

### 3. Backend API talablari

Backend serveringiz quyidagi endpoint'larni qo'llab-quvvatlashi kerak:

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register  
```
POST /auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe", 
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get User Info
```
GET /auth/me
Authorization: Bearer <token>
```

### 4. Test ma'lumotlari olib tashlandi

- Mock user ma'lumotlari olib tashlandi
- Fake API response'lar olib tashlandi
- Real backend API ga so'rovlar yuboriladi

### 5. Xatolik boshqaruvi

Agar backend server ishlamasa, quyidagi xatolik xabarlari ko'rsatiladi:
- "Server bilan bog'lanishda xatolik yuz berdi"
- "Authorization token kerak"

## Foydalanish

1. Backend serveringizni ishga tushiring
2. `.env.local` faylida BACKEND_URL ni to'g'ri URL ga o'zgartiring
3. Frontend ni ishga tushiring: `npm run dev`
4. Ro'yxatdan o'tish va kirish endi real backend bilan ishlaydi

