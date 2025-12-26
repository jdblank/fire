#!/bin/bash
# Clear LogTo Database - Start Fresh

set -e

echo "🗑️  Clear LogTo Database"
echo ""
echo "⚠️  WARNING: This will delete ALL data in the database!"
echo ""

if [ -z "$1" ]; then
    echo "Usage: $0 'postgresql://user:pass@host:port/dbname'"
    echo ""
    echo "To get the connection string:"
    echo "1. Railway → Postgres → Variables"
    echo "2. Copy DATABASE_URL value"
    echo "3. Run: $0 'your-database-url'"
    exit 1
fi

DATABASE_URL="$1"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Install PostgreSQL client:"
    echo "   brew install postgresql"
    exit 1
fi

echo "🔗 Connecting to database..."
echo ""

# Confirm
read -p "Are you sure you want to delete ALL data? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Clearing database..."
echo ""

# Drop and recreate schema
psql "$DATABASE_URL" <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database cleared successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Railway → intelligent-joy → Settings → Start Command"
    echo "2. Set to: /bin/sh -c \"cd /etc/logto/packages/core && NODE_ENV=production node . start\""
    echo "3. Save (triggers redeploy)"
    echo "4. LogTo will initialize fresh database"
else
    echo ""
    echo "❌ Failed to clear database"
    echo "Check your DATABASE_URL is correct"
    exit 1
fi



