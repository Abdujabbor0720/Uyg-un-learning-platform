# Uygunlik.uz Production Deployment Guide

## Server talablari

- Ubuntu 20.04+ yoki CentOS 8+
- Docker va Docker Compose
- Nginx (SSL sertifikati bilan)
- Kamida 2GB RAM va 20GB disk

## 1. Server sozlash

```bash
# Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose o'rnatish
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 2. SSL sertifikati o'rnatish

```bash
# Let's Encrypt yordamida SSL sertifikati olish
sudo apt install certbot
sudo certbot certonly --standalone -d uygunlik.uz -d www.uygunlik.uz

# Sertifikat fayllarini nginx papkasiga ko'chirish
sudo cp /etc/letsencrypt/live/uygunlik.uz/fullchain.pem /etc/ssl/certs/uygunlik.uz.crt
sudo cp /etc/letsencrypt/live/uygunlik.uz/privkey.pem /etc/ssl/private/uygunlik.uz.key
sudo chmod 644 /etc/ssl/certs/uygunlik.uz.crt
sudo chmod 600 /etc/ssl/private/uygunlik.uz.key
```

## 3. Loyihani klonlash va sozlash

```bash
# Loyihani klonlash
git clone https://github.com/your-username/anor-client-master.git
cd anor-client-master

# Deploy scriptini ishga tushirish
chmod +x deploy.sh
./deploy.sh
```

## 4. Nginx konfiguratsiyasini yangilash

SSL sertifikati yo'llarini tekshiring va kerak bo'lsa nginx.conf faylida o'zgartiring.

## 5. Domen sozlash

DNS sozlamalarida quyidagi A record'larni qo'shing:
```
uygunlik.uz -> SERVER_IP
www.uygunlik.uz -> SERVER_IP
```

## 6. Xavfsizlik sozlamalari

```bash
# Firewall sozlash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# SSL sertifikatini avtomatik yangilash
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 7. Monitoring

```bash
# Container'lar holatini ko'rish
docker-compose ps

# Log'larni ko'rish
docker-compose logs -f

# Health check
curl https://www.uygunlik.uz/health
```

## 8. Backup

```bash
# Ma'lumotlar bazasini backup qilish
cp client/anor.db backup/anor_$(date +%Y%m%d).db

# Upload fayllarini backup qilish
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz client/uploads/
```

## 9. Yangilash

```bash
# Yangi versiyani olish
git pull origin master

# Container'larni qayta build qilish
docker-compose down
docker-compose up --build -d
```

## Xatoliklar bilan ishlash

```bash
# Barcha log'larni ko'rish
docker-compose logs

# Faqat backend log'lari
docker-compose logs backend

# Faqat frontend log'lari
docker-compose logs frontend

# Container'ni qayta ishga tushirish
docker-compose restart backend
```

## Muvaffaqiyatli deploy qilinganidan keyin

- Frontend: https://www.uygunlik.uz
- API: https://www.uygunlik.uz/api
- Health Check: https://www.uygunlik.uz/health
