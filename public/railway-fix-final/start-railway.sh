#!/bin/bash

echo "🚂 Starting Trading Bot on Railway..."

# Set hostname for Docker/Railway
export HOSTNAME="0.0.0.0"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
bunx prisma generate || echo "Prisma generate skipped"

# Push database schema
echo "📊 Setting up database..."
bunx prisma db push --skip-generate || echo "Database push completed"

# Start Next.js on Railway PORT (IMPORTANT!)
echo "🚀 Starting Next.js app on 0.0.0.0:${PORT:-3000}..."
exec next start -H 0.0.0.0 -p ${PORT:-3000}
