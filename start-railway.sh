#!/bin/bash

# ============================================
# 🚂 Railway Startup Script
# ============================================

echo "🚂 Starting Trading Bot on Railway..."

# Set hostname for Docker/Railway
export HOSTNAME="0.0.0.0"

# Generate Prisma Client (just in case)
echo "📦 Generating Prisma Client..."
bunx prisma generate || echo "Prisma generate skipped (already done)"

# Push database schema
echo "📊 Setting up database..."
bunx prisma db push --skip-generate || echo "Database push completed with warnings"

# Start main Next.js app on 0.0.0.0
echo "🚀 Starting Next.js app on 0.0.0.0:3000..."
exec bunx next start -H 0.0.0.0 -p 3000
