# 🔧 Prisma Client Sync Issue - Prevention Guide

## What Happened

The Prisma client became out of sync with the database schema, causing posts to not display on the Dashboard. This happens when:

1. **Schema changes** but Prisma client isn't regenerated
2. **Dependencies update** but Prisma client isn't regenerated
3. **Container rebuild** without regenerating Prisma client
4. **Node modules** get out of sync

## The Fix

Regenerate the Prisma client:

```bash
# In Docker container
docker exec fire-app sh -c "cd /app/packages/db && npx prisma generate"

# Or restart the container (it will regenerate on startup if postinstall runs)
docker-compose restart app
```

## Prevention Measures

### 1. Automatic Regeneration on Install

Added `postinstall` script to `packages/db/package.json`:

- Automatically runs `prisma generate` after `pnpm install`
- Ensures client is always in sync after dependency updates

### 2. Check Script

Created `scripts/check-prisma-client.sh`:

- Verifies Prisma client exists and is up to date
- Regenerates if schema is newer than client
- Run before starting development: `./scripts/check-prisma-client.sh`

### 3. Docker Build

The `Dockerfile.dev` already includes Prisma generation:

```dockerfile
RUN cd packages/db && NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm exec prisma generate
```

### 4. When to Regenerate

**Always regenerate Prisma client when:**

- ✅ Schema changes (`schema.prisma` is modified)
- ✅ After pulling code that includes schema changes
- ✅ After `pnpm install` (now automatic via postinstall)
- ✅ When seeing database-related errors
- ✅ After container rebuild

## Quick Commands

```bash
# Check if Prisma client is in sync
./scripts/check-prisma-client.sh

# Manually regenerate (if needed)
pnpm db:generate

# Or in Docker
docker exec fire-app sh -c "cd /app/packages/db && npx prisma generate"

# Restart app after regeneration
docker-compose restart app
```

## Symptoms of Out-of-Sync Client

- ❌ Database queries fail with "column does not exist" errors
- ❌ TypeScript errors about missing Prisma types
- ❌ Data not displaying (like posts not showing)
- ❌ API routes returning 500 errors
- ❌ Prisma validation errors

## If It Happens Again

1. **Regenerate Prisma client:**

   ```bash
   docker exec fire-app sh -c "cd /app/packages/db && npx prisma generate"
   ```

2. **Restart the app:**

   ```bash
   docker-compose restart app
   ```

3. **Verify it's working:**
   - Check app logs: `docker-compose logs app --tail=50`
   - Test the feature that was broken
   - Check browser console for errors

## Best Practices

1. **Always commit schema changes** with code changes
2. **Run `pnpm install`** after pulling code (postinstall will regenerate)
3. **Check Prisma client** if you see database errors
4. **Document schema changes** in commit messages
5. **Test after schema changes** to catch issues early
