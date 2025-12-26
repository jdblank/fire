# Deployment Guide

This guide covers deploying the Fire platform to production.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 16+
- Redis 7+
- MinIO or S3-compatible storage
- Domain name with SSL certificate
- Node.js 20+ (for build steps)

## Environment Variables

Create a `.env.production` file with the following variables:

### Database
```bash
DATABASE_URL=postgres://user:password@host:5432/fire_db
POSTGRES_USER=fireuser
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=fire_db
```

### Redis
```bash
REDIS_URL=redis://host:6379
```

### Authentication
```bash
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-strong-secret-min-32-chars>
LOGTO_ENDPOINT=https://auth.yourdomain.com
LOGTO_APP_ID=<your-logto-app-id>
LOGTO_APP_SECRET=<your-logto-app-secret>
```

### Storage (S3/MinIO)
```bash
S3_ENDPOINT=https://s3.yourdomain.com
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET=fire-uploads
S3_REGION=us-east-1
S3_PUBLIC_URL=https://cdn.yourdomain.com
```

### Outline Wiki
```bash
OUTLINE_API_URL=https://wiki.yourdomain.com
OUTLINE_API_TOKEN=<outline-api-token>
```

## Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - fire-network

  # Add other services...
```

## Production Dockerfile

Create `apps/web/Dockerfile.prod`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/

RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

## Deployment Steps

### 1. Database Migration

```bash
# Run migrations
DATABASE_URL=<production-db-url> npm run db:migrate

# Verify
DATABASE_URL=<production-db-url> npm run db:studio
```

### 2. Build and Deploy

```bash
# Build Docker image
docker build -f apps/web/Dockerfile.prod -t fire-app:latest .

# Tag for registry
docker tag fire-app:latest registry.yourdomain.com/fire-app:latest

# Push to registry
docker push registry.yourdomain.com/fire-app:latest

# Deploy with compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL/TLS Setup

Use Nginx or Caddy as reverse proxy:

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Health Checks

Monitor these endpoints:
- `https://yourdomain.com/api/health` - Application health
- Database connectivity
- Redis connectivity
- S3/MinIO connectivity

### 5. Monitoring Setup

Recommended monitoring stack:
- **Application**: Sentry for error tracking
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack or Loki
- **Uptime**: UptimeRobot or similar

## Continuous Deployment

The GitHub Actions workflow automatically deploys on merge to `main`:

1. Tests run
2. Docker image builds
3. Image pushed to registry
4. Deploy script runs
5. Health checks verify deployment

## Rollback Procedure

If deployment fails:

```bash
# Find previous working version
docker images | grep fire-app

# Redeploy previous version
docker tag fire-app:v1.2.3 fire-app:latest
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl https://yourdomain.com/api/health
```

## Backup and Recovery

### Database Backups

```bash
# Automated daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240315.sql
```

### File Storage Backups

Use S3 versioning or periodic snapshots of MinIO data.

## Scaling

### Horizontal Scaling

Run multiple app containers behind a load balancer:

```yaml
app:
  deploy:
    replicas: 3
  ...
```

### Database Scaling

- Use read replicas for read-heavy operations
- Connection pooling (PgBouncer)
- Query optimization

### Caching Strategy

- Redis for session storage
- Next.js ISR for static pages
- CDN for static assets

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS everywhere
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set secure headers
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Secret management (AWS Secrets Manager, Vault)

## Performance Optimization

1. **CDN**: Use CloudFlare or similar
2. **Image Optimization**: Next.js Image component
3. **Database**: Proper indexing
4. **Caching**: Aggressive caching strategy
5. **Code Splitting**: Automatic with Next.js

## Troubleshooting

### Container won't start
```bash
docker-compose logs app
```

### Database connection issues
```bash
docker exec -it fire-postgres psql -U fireuser -d fire_db
```

### High memory usage
```bash
docker stats
```

## Support

For deployment issues, contact the platform team or open an issue.


