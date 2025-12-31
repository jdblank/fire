#!/bin/bash
# Stop on first error
set -e

echo "🛠️  Starting Vercel Build..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Run Database Migrations
echo "🗄️  Running Database Migrations..."
cd packages/db
# Use 'pnpm exec' to force using the local Prisma version (avoids v7 version mismatch)
pnpm exec prisma migrate deploy
cd ../..

# 3. Build the Web App
echo "🏗️  Building Web App..."
cd apps/web
next build
