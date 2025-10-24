# Backend Server API Talablari

## Server URL
```
http://localhost:5000
```

## 1. Foydalanuvchilar (Users) API

### 1.1 Ro'yxatdan o'tish
```
POST /users/register
Content-Type: application/json

Request Body:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "message": "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
  "user": {
    "id": "user123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "USER",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}

Response (Error):
{
  "error": "Email allaqachon mavjud",
  "status": 400
}
```

### 1.2 Kirish
```
POST /users/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (Success):
{
  "success": true,
  "message": "Xush kelibsiz!",
  "user": {
    "id": "user123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "USER",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}

Response (Error):
{
  "error": "Email yoki parol noto'g'ri",
  "status": 401
}
```

### 1.3 Foydalanuvchi ma'lumotlari
```
GET /users/me
Authorization: Bearer jwt_token_here

Response (Success):
{
  "success": true,
  "user": {
    "id": "user123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "USER",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}

Response (Error):
{
  "error": "Token noto'g'ri",
  "status": 401
}
```

### 1.4 Barcha foydalanuvchilar (Admin uchun)
```
GET /users
Authorization: Bearer admin_token_here

Response:
{
  "success": true,
  "users": [
    {
      "id": "user123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "user@example.com",
      "role": "USER",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 2. Kurslar (Courses) API

### 2.1 Barcha kurslar
```
GET /courses

Response:
{
  "success": true,
  "courses": [
    {
      "id": "course1",
      "title": "Ayollik tabiati",
      "description": "Ayollik tabiati haqida to'liq kurs",
      "price": 299000,
      "duration": "3 oy",
      "image": "/images/course1.jpg",
      "instructor": "Dr. Malika",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2.2 Bitta kurs
```
GET /courses/:id

Response:
{
  "success": true,
  "course": {
    "id": "course1",
    "title": "Ayollik tabiati",
    "description": "Ayollik tabiati haqida to'liq kurs",
    "price": 299000,
    "duration": "3 oy",
    "image": "/images/course1.jpg",
    "instructor": "Dr. Malika",
    "modules": [
      {
        "id": "module1",
        "title": "1-mavzu",
        "description": "Kirish",
        "videos": ["video1", "video2"]
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.3 Kurs yaratish (Admin)
```
POST /courses
Authorization: Bearer admin_token_here
Content-Type: application/json

Request Body:
{
  "title": "Yangi kurs",
  "description": "Kurs tavsifi",
  "price": 299000,
  "duration": "3 oy",
  "instructor": "Dr. Malika"
}
```

### 2.4 Kurs yangilash (Admin)
```
PUT /courses/:id
Authorization: Bearer admin_token_here
Content-Type: application/json
```

### 2.5 Kurs o'chirish (Admin)
```
DELETE /courses/:id
Authorization: Bearer admin_token_here
```

## 3. Videolar (Videos) API

### 3.1 Barcha videolar
```
GET /videos

Response:
{
  "success": true,
  "videos": [
    {
      "id": "video1",
      "title": "1-dars: Kirish",
      "description": "Ayollik tabiati haqida kirish",
      "filename": "lesson1.mp4",
      "duration": "15:30",
      "course_id": "course1",
      "module_id": "module1",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.2 Bitta video
```
GET /videos/:id

Response:
{
  "success": true,
  "video": {
    "id": "video1",
    "title": "1-dars: Kirish",
    "description": "Ayollik tabiati haqida kirish",
    "filename": "lesson1.mp4",
    "duration": "15:30",
    "course_id": "course1",
    "module_id": "module1",
    "url": "/videos/lesson1.mp4",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.3 Kurs bo'yicha videolar
```
GET /videos/course/:courseId

Response:
{
  "success": true,
  "videos": [
    {
      "id": "video1",
      "title": "1-dars: Kirish",
      "filename": "lesson1.mp4",
      "course_id": "course1"
    }
  ]
}
```

### 3.4 Video yaratish (Admin)
```
POST /videos
Authorization: Bearer admin_token_here
Content-Type: multipart/form-data

Request Body:
{
  "title": "Yangi video",
  "description": "Video tavsifi",
  "course_id": "course1",
  "module_id": "module1",
  "video_file": <file>
}
```

### 3.5 Video yangilash (Admin)
```
PUT /videos/:id
Authorization: Bearer admin_token_here
```

### 3.6 Video o'chirish (Admin)
```
DELETE /videos/:id
Authorization: Bearer admin_token_here
```

## 4. Qo'shimcha API Endpoint'lar

### 4.1 Kurs sotib olish
```
POST /purchases
Authorization: Bearer jwt_token_here
Content-Type: application/json

Request Body:
{
  "course_id": "course1",
  "payment_method": "card"
}

Response:
{
  "success": true,
  "message": "Kurs muvaffaqiyatli sotib olindi",
  "purchase": {
    "id": "purchase1",
    "user_id": "user123",
    "course_id": "course1",
    "amount": 299000,
    "status": "completed",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.2 Foydalanuvchi kurslari
```
GET /users/:userId/courses
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "courses": [
    {
      "id": "course1",
      "title": "Ayollik tabiati",
      "purchased_at": "2024-01-01T00:00:00.000Z",
      "progress": 45
    }
  ]
}
```

### 4.3 Video progress
```
POST /videos/:id/progress
Authorization: Bearer jwt_token_here
Content-Type: application/json

Request Body:
{
  "progress_percent": 75,
  "watched_duration": 600
}
```

## 5. Xatolik kodlari

- `200` - Muvaffaqiyatli
- `201` - Yaratildi
- `400` - Noto'g'ri so'rov
- `401` - Autentifikatsiya xatosi
- `403` - Ruxsat yo'q
- `404` - Topilmadi
- `500` - Server xatosi

## 6. Autentifikatsiya

Barcha himoyalangan endpoint'lar uchun:
```
Authorization: Bearer <jwt_token>
```

JWT token quyidagi ma'lumotlarni o'z ichiga olishi kerak:
- `user_id`
- `email`
- `role` (USER, ADMIN)
- `exp` (expiration time)

