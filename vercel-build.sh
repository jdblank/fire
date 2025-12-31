#!/bin/bash
# Stop on first error
set -e
echo "🛠️  Starting Vercel Build..."
echo "📦 Installing dependencies..."
pnpm install
echo "🗄️  Running Database Migrations..."
cd packages/db
# Use 'pnpm exec' to force using the local Prisma version (avoids v7 version mismatch)
pnpm exec prisma migrate deploy
cd ../..
echo "🏗️  Building Web App..."
cd apps/web
next build
