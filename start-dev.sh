#!/bin/bash

# Development servers ni ishga tushirish scripti

echo "🚀 Starting Uygunlik Learning Platform..."
echo ""

# Frontend (Next.js) - Port 3000
echo "📱 Starting Frontend (Next.js) on port 3000..."
cd "$(dirname "$0")"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo ""

# Backend (NestJS) - Port 5000
echo "🔧 Starting Backend (NestJS) on port 5000..."
cd client
npm run start:dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

echo "✅ Servers started!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Admin:    http://localhost:3000/admin"
echo ""
echo "⚠️  To stop servers, press Ctrl+C or run:"
echo "   kill $FRONTEND_PID $BACKEND_PID"
echo ""

# Wait for user to press Ctrl+C
wait
