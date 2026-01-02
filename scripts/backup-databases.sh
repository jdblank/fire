#!/bin/bash
# Automated database backup script
# Run daily via cron or manually before risky operations

set -e

BACKUP_DIR="/workspaces/fire/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔥 Fire Platform - Database Backup"
echo "=================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup fire_db (main app database)
echo "📦 Backing up fire_db..."
docker-compose exec -T postgres pg_dump -U fireuser fire_db > "$BACKUP_DIR/fire_db_$TIMESTAMP.sql"
echo "✅ fire_db backed up: fire_db_$TIMESTAMP.sql"

# Backup logto_db (auth database)
echo "📦 Backing up logto_db..."
docker-compose exec -T postgres pg_dump -U fireuser logto_db > "$BACKUP_DIR/logto_db_$TIMESTAMP.sql"
echo "✅ logto_db backed up: logto_db_$TIMESTAMP.sql"

# Create a combined backup with metadata
echo "📦 Creating metadata..."
cat > "$BACKUP_DIR/backup_$TIMESTAMP.meta" << EOF
Backup Date: $(date)
Fire DB Size: $(du -h "$BACKUP_DIR/fire_db_$TIMESTAMP.sql" | cut -f1)
LogTo DB Size: $(du -h "$BACKUP_DIR/logto_db_$TIMESTAMP.sql" | cut -f1)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
EOF
echo "✅ Metadata saved: backup_$TIMESTAMP.meta"

# Keep only last 7 days of backups (optional)
echo ""
echo "🧹 Cleaning old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "fire_db_*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "logto_db_*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "backup_*.meta" -mtime +7 -delete

echo ""
echo "✅ Backup complete!"
echo "Location: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*$TIMESTAMP*
