#!/bin/bash
# Database restore script
# Usage: ./scripts/restore-databases.sh [timestamp]
# Example: ./scripts/restore-databases.sh 20250102_031935

set -e

BACKUP_DIR="/workspaces/fire/backups"
TIMESTAMP=$1

if [ -z "$TIMESTAMP" ]; then
    echo "❌ Error: No timestamp provided"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.meta 2>/dev/null | awk '{print $9}' | sed 's/.*backup_//' | sed 's/.meta//' || echo "No backups found"
    echo ""
    echo "Usage: $0 [timestamp]"
    echo "Example: $0 20250102_031935"
    exit 1
fi

echo "🔥 Fire Platform - Database Restore"
echo "==================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if backup files exist
if [ ! -f "$BACKUP_DIR/fire_db_$TIMESTAMP.sql" ]; then
    echo "❌ Error: fire_db_$TIMESTAMP.sql not found"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/logto_db_$TIMESTAMP.sql" ]; then
    echo "❌ Error: logto_db_$TIMESTAMP.sql not found"
    exit 1
fi

# Show backup metadata
if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.meta" ]; then
    echo "📋 Backup Metadata:"
    cat "$BACKUP_DIR/backup_$TIMESTAMP.meta"
    echo ""
fi

# Confirm restore
read -p "⚠️  This will OVERWRITE current databases. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "📦 Restoring fire_db..."
cat "$BACKUP_DIR/fire_db_$TIMESTAMP.sql" | docker-compose exec -T postgres psql -U fireuser -d fire_db
echo "✅ fire_db restored"

echo ""
echo "📦 Restoring logto_db..."
cat "$BACKUP_DIR/logto_db_$TIMESTAMP.sql" | docker-compose exec -T postgres psql -U fireuser -d logto_db
echo "✅ logto_db restored"

echo ""
echo "🔄 Running database migrations..."
cd packages/db && npx prisma migrate deploy
cd ../..

echo ""
echo "✅ Restore complete!"
echo "🔄 Restart your app: docker-compose restart app"
