#!/bin/bash

# Run Prisma migrations on production database
# This creates all the application tables

set -e

echo "🚀 Running Prisma migrations on production database..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Set it to your Railway PUBLIC database connection string:"
  echo "export DATABASE_URL='postgresql://postgres:password@host.proxy.rlwy.net:port/fire_db'"
  echo ""
  echo "Get it from: Railway Dashboard → Postgres → Variables → DATABASE_URL (PUBLIC)"
  exit 1
fi

echo "📋 Database URL: ${DATABASE_URL%%@*}@***"
echo ""

# Navigate to db package
cd "$(dirname "$0")/../packages/db" || exit 1

echo "📦 Running Prisma migrations..."
echo ""

# Run migrations
pnpm exec prisma migrate deploy

echo ""
echo "✅ Migrations completed!"
echo ""
echo "Next steps:"
echo "1. Verify tables were created in Railway database"
echo "2. Test the health endpoint: https://fire.lemonade.art/api/health"
echo "3. Try signing in again"

