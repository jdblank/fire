# 🔥 Fire Platform - Backup & Recovery Guide

## Quick Reference

```bash
# Create backup
./scripts/backup-databases.sh

# Restore backup
./scripts/restore-databases.sh [timestamp]

# List available backups
ls -lh backups/*.meta
```

---

## Protection Strategy

### 1. **Automated Daily Backups** ⏰

Set up a daily cron job to automatically backup databases:

```bash
# Open crontab
crontab -e

# Add this line to backup daily at 2 AM
0 2 * * * cd /workspaces/fire && ./scripts/backup-databases.sh >> logs/backup.log 2>&1
```

### 2. **Manual Backups Before Risky Operations** 🛡️

**ALWAYS backup before:**

- Restarting Docker/OrbStack
- Running database migrations
- Major deployments
- Schema changes
- Data imports/migrations

```bash
./scripts/backup-databases.sh
```

### 3. **Git-Ignore Backups** 📝

Backups are already in `.gitignore` to avoid committing large files:

```
backups/*.sql
```

Keep metadata files (`.meta`) if you want to track backup history.

---

## Usage Examples

### Create a Backup

```bash
./scripts/backup-databases.sh
```

Output:

```
🔥 Fire Platform - Database Backup
Timestamp: 20260102_033440
📦 Backing up fire_db...
✅ fire_db backed up: fire_db_20260102_033440.sql
📦 Backing up logto_db...
✅ logto_db backed up: logto_db_20260102_033440.sql
✅ Backup complete!
```

### List Available Backups

```bash
ls -lh backups/*.meta
```

Or view metadata:

```bash
cat backups/backup_20260102_033440.meta
```

### Restore a Backup

```bash
# Find the timestamp you want
ls -lh backups/*.meta

# Restore it
./scripts/restore-databases.sh 20260102_033440
```

The script will:

1. Show backup metadata
2. Ask for confirmation
3. Restore both databases
4. Run migrations
5. Prompt you to restart the app

---

## What Gets Backed Up

- **fire_db**: Main application database (users, events, posts, etc.)
- **logto_db**: Authentication database (users, roles, sessions, etc.)
- **Metadata**: Git commit, timestamp, file sizes

---

## Retention Policy

**Default**: Keep last 7 days of backups

To change retention, edit `backup-databases.sh`:

```bash
# Change -mtime +7 to your desired days
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
```

---

## Recovery Scenarios

### Scenario 1: OrbStack Restart Data Loss

```bash
# 1. Find most recent backup
ls -lh backups/*.meta | tail -1

# 2. Restore it
./scripts/restore-databases.sh [timestamp]

# 3. Restart app
docker-compose restart app

# 4. Test login and verify data
```

### Scenario 2: Bad Migration

```bash
# 1. Restore backup from before migration
./scripts/restore-databases.sh [timestamp]

# 2. Fix migration
# 3. Re-run migrations
cd packages/db && npx prisma migrate deploy
```

### Scenario 3: Accidental Data Deletion

```bash
# 1. Restore most recent backup
./scripts/restore-databases.sh [latest-timestamp]

# 2. Verify data is restored
```

---

## Production Backups

For production, use managed database backups:

### Vercel Postgres

- Automatic daily backups
- Point-in-time recovery
- Retention: 7 days (Hobby) / 14+ days (Pro+)

### Manual Production Backup

```bash
# Set production DB connection
export DATABASE_URL="postgresql://..."

# Backup
pg_dump $DATABASE_URL > backups/prod_fire_db_$(date +%Y%m%d_%H%M%S).sql
```

---

## Best Practices

1. ✅ **Backup before Docker restarts**
2. ✅ **Backup before migrations**
3. ✅ **Test restore periodically** (verify backups work)
4. ✅ **Store backups off-machine** (cloud storage, external drive)
5. ✅ **Document your backup schedule**
6. ✅ **Keep git commit info** (helps correlate code & data)

---

## Troubleshooting

### Backup fails with "connection refused"

```bash
# Ensure Docker is running
docker-compose ps

# Start services if needed
docker-compose up -d
```

### Restore fails with "foreign key constraint"

```bash
# Run migrations after restore
cd packages/db && npx prisma migrate deploy
```

### "No backups found"

```bash
# Check backup directory
ls -lh backups/

# Create initial backup
./scripts/backup-databases.sh
```

---

## Emergency Contacts

If you need help:

1. Check this guide
2. Check logs: `docker-compose logs postgres`
3. Check backup logs: `cat logs/backup.log`
4. Contact: josh@lemonade.art
