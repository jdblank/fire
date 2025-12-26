# 🗄️ Production Database Setup

## Recommended: Same PostgreSQL Service, Different Databases

This matches your development setup and provides good isolation while keeping costs low.

---

## Current Setup

**Railway Postgres Service:**
- LogTo uses: `logto_db` (or `railway` - the default database)
- App will use: `fire_db` (new database we'll create)

---

## Step 1: Create App Database in Railway Postgres

### Option A: Via Railway Dashboard (Easiest)

Railway doesn't have a direct UI for creating databases, so we'll use SQL:

1. **Go to Railway** → **Fire Production** → **Postgres** service
2. **Click "Query" tab** (or "Connect" → "PostgreSQL")
3. **Run this SQL:**

```sql
-- Create the app database
CREATE DATABASE fire_db;

-- Verify it was created
\l
```

### Option B: Via psql Command Line

If you have `psql` installed locally:

```bash
# Get the connection string from Railway
# Railway → Postgres → Variables → DATABASE_URL

# Connect and create database
psql "postgresql://postgres:password@host:port/railway" -c "CREATE DATABASE fire_db;"
```

### Option C: Via Docker (if you have Docker)

```bash
# Get DATABASE_URL from Railway Postgres Variables
export DATABASE_URL="postgresql://postgres:password@host:port/railway"

# Create database
docker run --rm postgres:16-alpine \
  psql "$DATABASE_URL" -c "CREATE DATABASE fire_db;"
```

---

## Step 2: Get Connection Strings

### For LogTo (Already Set):
- Database: `railway` (or `logto_db` if you created it)
- Connection: Already configured in Railway LogTo service

### For Vercel App (New):
- Database: `fire_db` (the one we just created)
- Connection: Same host/port/credentials, just different database name

**Format:**
```
postgresql://postgres:password@host.proxy.rlwy.net:port/fire_db
```

**To get it:**
1. Railway → Postgres → Variables → `DATABASE_URL`
2. Copy the connection string
3. Change the database name at the end from `/railway` to `/fire_db`

**Example:**
```
Original: postgresql://postgres:pass@host.proxy.rlwy.net:12345/railway
App URL:  postgresql://postgres:pass@host.proxy.rlwy.net:12345/fire_db
```

---

## Step 3: Set Vercel Environment Variable

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Add:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres:pass@host.proxy.rlwy.net:12345/fire_db`
   - Environment: **Production**
3. **Save**

---

## Step 4: Run Prisma Migrations

After setting `DATABASE_URL` in Vercel, run migrations:

### Option A: Via Vercel Build (Automatic)

If your `package.json` has a build script that runs migrations:

```json
{
  "scripts": {
    "build": "prisma migrate deploy && next build"
  }
}
```

### Option B: Via Vercel CLI (Manual)

```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Or via Docker
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  -v $(pwd):/app \
  node:20-alpine \
  sh -c "cd /app && npm install && npx prisma migrate deploy"
```

### Option C: Direct Connection

```bash
# Get DATABASE_URL from Vercel or Railway
export DATABASE_URL="postgresql://postgres:pass@host:port/fire_db"

# Run migrations
npx prisma migrate deploy
```

---

## Step 5: Verify Setup

### Check LogTo Database:
```sql
-- Connect to LogTo database
\c railway  -- or \c logto_db

-- List tables
\dt

-- Should see LogTo tables (users, applications, etc.)
```

### Check App Database:
```sql
-- Connect to app database
\c fire_db

-- List tables
\dt

-- Should see Prisma tables (User, Post, etc.)
```

---

## Alternative: Separate PostgreSQL Services

If you prefer maximum isolation:

1. **Railway** → **Fire Production** → **+ New** → **Database** → **PostgreSQL**
2. Name it: `fire-app-db` (or similar)
3. Use this new service's `DATABASE_URL` for Vercel
4. Keep existing Postgres for LogTo only

**Pros:**
- ✅ Maximum isolation
- ✅ Independent scaling
- ✅ Can restart one without affecting the other

**Cons:**
- ❌ Higher cost (2 Postgres services)
- ❌ More complex (2 connection strings)
- ❌ Doesn't match dev setup

---

## Recommendation

**Use Option 1 (Same Service, Different Databases)** because:
- ✅ Matches your dev setup
- ✅ Lower cost
- ✅ Simpler to manage
- ✅ Good enough isolation (databases are separate)
- ✅ Industry standard practice

---

## Security Notes

- ✅ Each database is isolated (can't access each other's tables)
- ✅ Same credentials, but different database names
- ✅ LogTo can only access `logto_db` tables
- ✅ App can only access `fire_db` tables
- ✅ Use connection pooling for production (Railway provides this)

---

## Next Steps

1. ✅ Create `fire_db` database
2. ✅ Get connection string with `/fire_db` database name
3. ✅ Set `DATABASE_URL` in Vercel
4. ✅ Run Prisma migrations
5. ✅ Test database connection

