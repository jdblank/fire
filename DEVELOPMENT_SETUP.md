# Development Setup - Hybrid Approach

**Infrastructure in Docker, App runs locally**

## Why This Approach?

- ✅ Fast development with hot-reload
- ✅ Easy debugging with local tools
- ✅ Avoids Docker/npm issues on macOS
- ✅ Production still uses Docker (CI/CD)
- ✅ Common practice in modern development

## Setup (One-Time - 5 minutes)

### 1. Start Infrastructure Services

```bash
# Start all backend services in Docker
docker-compose up -d postgres redis minio logto outline

# Verify all services are running
./scripts/validate-infrastructure.sh
```

### 2. Install Node.js (if not installed)

Check if you have Node 20+:
```bash
node --version  # Should be v20.x.x or higher
```

If not, install from: https://nodejs.org/ (or use `nvm`)

### 3. Install pnpm

```bash
npm install -g pnpm
```

### 4. Install Dependencies

```bash
cd /Users/josh.blank/fire
pnpm install
```

### 5. Setup Environment

Create `.env.local` in the project root (or it already exists):
```bash
# Copy from .env.example
cp .env.example .env.local

# It should have (already configured):
DATABASE_URL=postgres://fireuser:firepass@localhost:5432/fire_db
REDIS_URL=redis://localhost:6379
LOGTO_ENDPOINT=http://localhost:3001
LOGTO_APP_ID=<your-web-app-id-from-logto>
LOGTO_APP_SECRET=<your-web-app-secret-from-logto>
LOGTO_M2M_APP_ID=<your-m2m-app-id-from-logto>
LOGTO_M2M_APP_SECRET=<your-m2m-app-secret-from-logto>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

### 6. Run Database Migrations

```bash
pnpm db:migrate
```

### 7. Start Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000 🚀

## Daily Workflow

```bash
# Morning - start infrastructure
docker-compose up -d

# Start developing
pnpm dev

# Evening - stop everything
docker-compose down
```

## Production Builds

Production still uses Docker (works fine in CI/CD):

```bash
# Build for production
docker build -f apps/web/Dockerfile.prod -t fire-app:prod .

# Test production build
docker run -p 3000:3000 fire-app:prod
```

CI/CD (GitHub Actions) builds in Linux containers where npm/pnpm work fine.

## Benefits

- **Fast**: No Docker overhead
- **Easy debugging**: Use VS Code debugger, Chrome DevTools
- **Hot reload**: Instant updates
- **No SSL issues**: Local Node.js works perfectly
- **Still Docker-first**: Infrastructure all in Docker

## Commands

```bash
# Infrastructure
docker-compose up -d                    # Start all services
docker-compose ps                       # Check status
docker-compose logs -f [service]        # View logs
docker-compose down                     # Stop all

# Development
pnpm dev                                # Start app
pnpm build                              # Build app
pnpm lint                               # Lint code
pnpm test                               # Run tests

# Database
pnpm db:migrate                         # Run migrations
pnpm db:studio                          # Open Prisma Studio
```

## Troubleshooting

**Can't connect to database:**
```bash
# Make sure PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it fire-postgres psql -U fireuser -d fire_db
```

**Can't connect to LogTo:**
```bash
# Check LogTo is running
docker ps | grep logto

# Check logs
docker logs fire-logto
```

**Port already in use:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it or use different port
PORT=3001 pnpm dev
```

**Prisma client out of sync:**
```bash
# Check if Prisma client is in sync (recommended first step)
./scripts/check-prisma-client.sh

# If you get Prisma validation errors after schema changes:
# Regenerate Prisma client in the app container
docker exec fire-app sh -c "cd /app/packages/db && npx prisma generate"

# Or use the package script
pnpm db:generate

# Then restart the app
docker-compose restart app
```

**Note:** Prisma client now auto-regenerates on `pnpm install` via postinstall script. See `PRISMA_CLIENT_SYNC.md` for details.

---

**This is a battle-tested approach used by many teams!** ✅

