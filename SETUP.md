# Setup Guide

## First Time Setup

### 1. Start Services

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Or manually:
```bash
docker-compose up -d
```

### 2. Configure Database

```bash
# Install dependencies (runs in container)
docker-compose exec app npm install

# Run migrations
docker-compose exec app npm run db:migrate

# (Optional) Open Prisma Studio
docker-compose exec app npm run db:studio
```

### 3. Configure LogTo Authentication

1. Open LogTo Admin Console: http://localhost:3002
2. Create an account (first user is admin)
3. Create a new application:
   - Type: Traditional Web
   - Name: Fire App
   - Redirect URI: `http://localhost:3000/api/auth/callback/logto`
4. Copy the Client ID and Client Secret
5. Update `docker-compose.yml` with the credentials

### 4. Configure Outline Wiki

1. Generate secret keys:
   ```bash
   openssl rand -hex 32  # For SECRET_KEY
   openssl rand -hex 32  # For UTILS_SECRET
   ```

2. Update `docker-compose.yml` with the secrets

3. Configure OIDC with LogTo:
   - Create another app in LogTo for Outline
   - Update Outline environment variables

### 5. Verify Everything Works

Visit:
- http://localhost:3000 - Main app should show welcome page
- http://localhost:3002 - LogTo admin
- http://localhost:3003 - Outline wiki
- http://localhost:9001 - MinIO console (minioadmin/minioadmin123)

## Development Workflow

### Daily Development

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

### Database Changes

```bash
# Create migration
docker-compose exec app npm run db:migrate

# Push schema without migration
docker-compose exec app npm run db:push

# View data in Prisma Studio
docker-compose exec app npm run db:studio
```

### Rebuilding After Code Changes

```bash
# Rebuild app container
docker-compose up -d --build app

# Or rebuild everything
docker-compose up -d --build
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d
```

### Database connection issues

```bash
# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port conflicts

If ports 3000, 3001, 3002, 3003, 5432, 6379, 9000, or 9001 are in use:
1. Stop the conflicting service
2. Or edit `docker-compose.yml` to use different ports

## Production Considerations

Before deploying to production:

1. **Change all default passwords**
2. **Generate strong secrets** for all services
3. **Enable HTTPS** with proper certificates
4. **Set up proper backup** for PostgreSQL and MinIO
5. **Configure proper CORS** settings
6. **Set up monitoring** and logging
7. **Review security settings** in all services
8. **Set NODE_ENV=production**
















