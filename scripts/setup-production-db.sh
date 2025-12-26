#!/bin/bash
set -e

# Setup Production Database for Fire App
# Creates fire_db database and runs Prisma migrations

# Configuration
DATABASE_URL="${DATABASE_URL}"
DB_NAME="${DB_NAME:-fire_db}"

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL must be set"
  echo ""
  echo "Usage:"
  echo "  DATABASE_URL='postgresql://postgres:pass@host:port/railway' ./scripts/setup-production-db.sh"
  echo ""
  echo "Or set it as an environment variable:"
  echo "  export DATABASE_URL='postgresql://postgres:pass@host:port/railway'"
  echo "  ./scripts/setup-production-db.sh"
  exit 1
fi

echo "🗄️  Setting up production database..."
echo ""

# Extract connection details (without database name)
# Remove the database name from the end of the URL
BASE_URL=$(echo "$DATABASE_URL" | sed 's|/[^/]*$|/postgres|')

echo "1. Creating database: $DB_NAME"
echo "   Using base connection: ${BASE_URL}"

# Create the database using Docker (if psql is not available locally)
if command -v psql &> /dev/null; then
  # Use local psql if available
  echo "   Using local psql..."
  psql "$BASE_URL" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    if [ $? -eq 0 ]; then
      echo "   ✅ Database created (or already exists)"
    else
      echo "   ⚠️  Database might already exist, continuing..."
    fi
  }
else
  # Use Docker psql
  echo "   Using Docker psql..."
  docker run --rm postgres:16-alpine \
    psql "$BASE_URL" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    if [ $? -eq 0 ]; then
      echo "   ✅ Database created (or already exists)"
    else
      echo "   ⚠️  Database might already exist, continuing..."
    fi
  }
fi

echo ""

# Update DATABASE_URL to point to the new database
APP_DATABASE_URL=$(echo "$DATABASE_URL" | sed "s|/[^/]*$|/$DB_NAME|")

echo "2. Database connection string for app:"
echo "   ${APP_DATABASE_URL}"
echo ""

# Check if we should run migrations
read -p "Do you want to run Prisma migrations now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "3. Running Prisma migrations..."
  
  # Check if we're in a Docker environment or local
  if [ -f "package.json" ] && [ -d "packages/db" ]; then
    # Local environment - use pnpm/npm
    if command -v pnpm &> /dev/null; then
      echo "   Using pnpm..."
      export DATABASE_URL="$APP_DATABASE_URL"
      cd packages/db
      pnpm install
      pnpm db:generate
      npx prisma migrate deploy
      cd ../..
    elif command -v npm &> /dev/null; then
      echo "   Using npm..."
      export DATABASE_URL="$APP_DATABASE_URL"
      cd packages/db
      npm install
      npx prisma generate
      npx prisma migrate deploy
      cd ../..
    else
      echo "   ⚠️  pnpm/npm not found, using Docker..."
      docker run --rm \
        -e DATABASE_URL="$APP_DATABASE_URL" \
        -v "$(pwd):/app" \
        -w /app/packages/db \
        node:20-slim \
        sh -c "apt-get update -qq && apt-get install -y -qq openssl ca-certificates > /dev/null 2>&1 && npm install && npx prisma generate && npx prisma migrate deploy"
    fi
  else
    echo "   ⚠️  Not in project root, using Docker..."
    docker run --rm \
      -e DATABASE_URL="$APP_DATABASE_URL" \
      -v "$(pwd):/app" \
      -w /app/packages/db \
      node:20-slim \
      sh -c "apt-get update -qq && apt-get install -y -qq openssl ca-certificates > /dev/null 2>&1 && npm install && npx prisma generate && npx prisma migrate deploy"
  fi
  
  echo "   ✅ Migrations completed!"
else
  echo "3. Skipping migrations (you can run them later)"
  echo ""
  echo "   To run migrations manually:"
  echo "   export DATABASE_URL='$APP_DATABASE_URL'"
  echo "   cd packages/db"
  echo "   npx prisma migrate deploy"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set this in Vercel environment variables:"
echo "      DATABASE_URL=$APP_DATABASE_URL"
echo ""
echo "   2. Verify the database connection"
echo "   3. Test your application"

