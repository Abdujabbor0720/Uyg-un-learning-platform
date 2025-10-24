# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build backend
RUN cd client && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/client/node_modules ./client/node_modules

# Create uploads directory
RUN mkdir -p ./client/uploads && chown -R nextjs:nodejs ./client/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=https://www.uygunlik.uz/api

# Expose ports
EXPOSE 3000 5000

# Start both servers
USER nextjs
CMD ["sh", "-c", "cd client && npm run start:prod & npm run start"]



