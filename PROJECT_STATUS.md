# 🔥 Fire Platform - Project Status

**Last Updated**: January 2, 2026
**Status**: ✅ Stable - Ready for new features
**Branch**: `main`

---

## Current State

### ✅ Working Systems

- **Authentication**: LogTo with roles (admin, editor, user)
- **Database**: PostgreSQL with all migrations applied
- **Data**: Users, events, posts restored and working
- **Tests**: All 44 tests passing
- **Docker**: Services healthy and persistent
- **Backups**: Automated backup/restore system in place

### 🏗️ Recent Architecture Changes

#### 1. **Auth Configuration Split** (Jan 2, 2026)

**Problem**: Docker networking prevented OIDC discovery in dev environment.

**Solution**: Split NextAuth v5 configuration:

- **`auth.config.ts`**: Edge-safe provider config with manual endpoints
  - Browser uses: `http://localhost:3001`
  - Server uses: `http://logto:3001` (Docker service name)
  - Added ES384 JWT algorithm support (LogTo requirement)
- **`auth.ts`**: Node.js-specific with database sync callbacks
  - Syncs LogTo users to app database
  - Handles role propagation from LogTo to session

**Files Changed**:

- `apps/web/src/auth.config.ts` (added manual endpoints + ES384)
- `apps/web/src/auth.ts` (no changes, uses split config)
- `apps/web/src/middleware.ts` (reverted to git version)

**Why**: Production works with OIDC discovery, dev needs manual endpoints due to Docker networking.

#### 2. **Database Persistence & Backup System** (Jan 2, 2026)

**Problem**: OrbStack restart caused data loss.

**Solution**: Implemented comprehensive backup strategy:

- **Automated backups**: `scripts/backup-databases.sh`
- **Easy restore**: `scripts/restore-databases.sh [timestamp]`
- **Safe restart**: `scripts/safe-restart.sh` (backup before stopping Docker)
- **Documentation**: `BACKUP_GUIDE.md`
- **Retention**: Last 7 days of backups kept automatically

**Files Added**:

- `scripts/backup-databases.sh`
- `scripts/restore-databases.sh`
- `scripts/safe-restart.sh`
- `BACKUP_GUIDE.md`

**Docker Volumes**: Using bind mounts to `.docker-data/` for persistence.

---

## Database State

### Fire DB (`fire_db`)

- **Users**: 4 (including josh@lemonade.art with admin role)
- **Events**: 2 (Burning Man 2025, 2026)
- **Posts**: 1
- **Status**: ✅ All tables healthy, migrations applied

### LogTo DB (`logto_db`)

- **Roles**: admin, editor, user
- **Users**: Synced with fire_db
- **Status**: ✅ ES384 JWT signing configured

### Migrations Applied

1. `20251226034704_init` - Initial schema
2. `20251230195227_add_is_all_day` - Added isAllDay field to events

---

## Environment Configuration

### Development (Docker)

```env
LOGTO_ENDPOINT=http://logto:3001          # Server-side
LOGTO_ISSUER=http://localhost:3001/oidc   # Expected issuer
DATABASE_URL=postgres://fireuser:firepass@postgres:5432/fire_db
```

### Key Differences: Dev vs Prod

| Aspect          | Development       | Production            |
| --------------- | ----------------- | --------------------- |
| LogTo Discovery | Manual endpoints  | Auto (OIDC)           |
| Database        | Docker PostgreSQL | Vercel Postgres       |
| Persistence     | Bind mounts       | Managed storage       |
| Backups         | Manual scripts    | Automated (7-14 days) |

---

## Git Status

### Uncommitted Changes (Pending Review)

- `apps/web/src/auth.config.ts` - ES384 + manual endpoints
- `.gitignore` - Added backup file exclusions
- `scripts/seed-roles.ts` - Minor updates
- `pnpm-lock.yaml` - Dependency updates

### New Files (Untracked)

- `BACKUP_GUIDE.md` - Backup documentation
- `PROJECT_STATUS.md` - This file
- `scripts/backup-databases.sh` - Backup automation
- `scripts/restore-databases.sh` - Restore automation
- `scripts/safe-restart.sh` - Safe Docker restart
- `backups/*.meta` - Backup metadata files

---

## Testing Status

**Command**: `pnpm test`

**Results**: ✅ All 44 tests passing

- Import utils: 2 tests
- Link preview: 5 tests
- CSV utils: 13 tests
- Utils: 5 tests
- Network utils: 10 tests
- Upload utils: 9 tests

**Coverage**: Good coverage of utility functions and import logic.

---

## Known Issues

### None (Stable)

All critical issues have been resolved:

- ✅ Auth working with roles
- ✅ Database persistence fixed
- ✅ ES384 JWT signing configured
- ✅ Event imports working
- ✅ Migrations up to date

---

## Next Steps

### Ready for New Features ✨

The system is stable and ready for:

- New event features
- User management enhancements
- Payment integrations
- UI/UX improvements

### Recommended Before Starting

1. Commit current auth changes with message:

   ```
   fix(auth): add ES384 and manual endpoints for Docker dev environment

   - Add ES384 JWT algorithm support (LogTo requirement)
   - Manually specify OIDC endpoints for Docker networking
   - Split config between browser (localhost) and server (docker service)

   Fixes authentication in dev environment while maintaining prod compatibility.
   ```

2. Commit backup system:

   ```
   feat(ops): add automated database backup and restore system

   - Add backup-databases.sh (automated backups)
   - Add restore-databases.sh (easy restore)
   - Add safe-restart.sh (backup before Docker restart)
   - Add BACKUP_GUIDE.md documentation
   - Update .gitignore for backup files

   Protects against data loss from Docker/OrbStack restarts.
   ```

3. Create backup before starting new work:
   ```bash
   ./scripts/backup-databases.sh
   ```

---

## Rollback Plan

If issues arise, restore from latest backup:

```bash
# List backups
ls -lh backups/*.meta

# Restore
./scripts/restore-databases.sh [timestamp]

# Restart
docker-compose restart app
```

---

## Contact

**Developer**: Josh
**Email**: josh@lemonade.art
**Last Session**: January 2, 2026 - Auth fixes, backup system, documentation
