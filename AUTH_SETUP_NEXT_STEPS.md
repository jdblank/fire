# 🔐 Authentication Setup - Next Steps

## ✅ What's Been Created

### Authentication Integration Code

- ✅ `src/lib/auth.ts` - LogTo client configuration
- ✅ `src/app/api/auth/login/route.ts` - Login endpoint
- ✅ `src/app/api/auth/callback/logto/route.ts` - OAuth callback handler
- ✅ `src/app/api/auth/logout/route.ts` - Logout endpoint
- ✅ `src/app/api/auth/user/route.ts` - Get current user info
- ✅ `src/middleware.ts` - Route protection middleware
- ✅ `src/components/AuthButton.tsx` - Sign in/out button component
- ✅ `src/app/page.tsx` - Updated home page with auth
- ✅ `src/app/dashboard/page.tsx` - Protected dashboard page

### Dependencies Added

- ✅ `@logto/node` - LogTo SDK for Node.js/Next.js

### Documentation

- ✅ `LOGTO_SETUP_GUIDE.md` - Complete LogTo configuration guide

## 🚀 Next Steps

### Step 1: Configure LogTo Admin Console (10 minutes)

**Open the LogTo Admin Console:**

```bash
open http://localhost:3002
```

Follow the guide in `LOGTO_SETUP_GUIDE.md` to:

1. Create your admin account
2. Create API Resource (`Fire Platform API`)
3. Create M2M Application (for backend)
4. Create Web Application (for users)
5. Configure redirect URIs

### Step 2: Update docker-compose.yml (5 minutes)

Uncomment and update the `app` service in `docker-compose.yml`:

```yaml
# Next.js App - Main application
app:
  build:
    context: .
    dockerfile: apps/web/Dockerfile.dev
  container_name: fire-app
  restart: unless-stopped
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    logto:
      condition: service_started
  environment:
    NODE_ENV: development

    # Database
    DATABASE_URL: postgres://fireuser:firepass@postgres:5432/fire_db
    REDIS_URL: redis://redis:6379

    # LogTo Authentication (REPLACE WITH YOUR VALUES)
    LOGTO_ENDPOINT: http://logto:3001
    LOGTO_APP_ID: <your-web-app-id>
    LOGTO_APP_SECRET: <your-web-app-secret>

    # LogTo Management API
    LOGTO_M2M_APP_ID: <your-m2m-app-id>
    LOGTO_M2M_APP_SECRET: <your-m2m-app-secret>
    LOGTO_API_RESOURCE: https://api.fire-platform.local

    # NextAuth
    NEXTAUTH_URL: http://localhost:3000
    NEXTAUTH_SECRET: <generate-with-openssl-rand-base64-32>

    # MinIO/S3
    S3_ENDPOINT: http://minio:9000
    S3_ACCESS_KEY: minioadmin
    S3_SECRET_KEY: minioadmin123
    S3_BUCKET: fire-uploads
    S3_REGION: us-east-1
    S3_PUBLIC_URL: http://localhost:9100/fire-uploads

    # Outline API
    OUTLINE_API_URL: http://outline:3000
    OUTLINE_API_TOKEN: ''
  ports:
    - '3000:3000'
  volumes:
    - ./apps/web:/app/apps/web
    - ./packages:/app/packages
    - /app/node_modules
    - /app/apps/web/node_modules
    - /app/apps/web/.next
  networks:
    - fire-network
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Step 3: Start the App (5 minutes)

```bash
# Rebuild and start
docker-compose up -d --build app

# Watch logs
docker-compose logs -f app
```

Wait for:

```
✓ Ready on http://localhost:3000
```

### Step 4: Test Authentication (5 minutes)

1. **Visit the app:**

   ```bash
   open http://localhost:3000
   ```

2. **Click "Sign In"** button in the header

3. **Create a test account** in LogTo

4. **You should be redirected back** - authenticated!

5. **Visit dashboard:**

   ```bash
   open http://localhost:3000/dashboard
   ```

   Should show your profile information

6. **Test logout** - Click "Sign Out"

## 🎯 What You Can Do After Setup

### Protected Routes

These routes require authentication (defined in `middleware.ts`):

- `/dashboard` - User dashboard
- `/profile` - User profile (coming soon)
- `/events/create` - Create events (coming soon)

### API Endpoints

- `GET /api/auth/login` - Redirect to LogTo login
- `GET /api/auth/callback/logto` - OAuth callback
- `GET /api/auth/logout` - Sign out
- `GET /api/auth/user` - Get current user info
- `GET /api/health` - Health check

### Add More Protected Routes

Edit `src/middleware.ts`:

```typescript
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/events/create',
  '/admin', // Add new routes here
]
```

## 🐛 Troubleshooting

### "Redirect URI mismatch"

- Check LogTo Web Application settings
- Ensure redirect URI is exactly: `http://localhost:3000/api/auth/callback/logto`
- No trailing slashes

### "Invalid credentials"

- Double-check App ID and App Secret in docker-compose.yml
- Make sure you're using **Web Application** credentials for LOGTO_APP_ID
- Use **M2M Application** credentials for LOGTO_M2M_APP_ID

### "Cannot connect to LogTo"

```bash
# Check LogTo is running
docker-compose ps | grep logto

# Check logs
docker-compose logs logto

# Restart if needed
docker-compose restart logto
```

### "Module not found: @logto/node"

```bash
# Rebuild the app container
docker-compose down app
docker-compose up -d --build app
```

### App won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - Missing environment variables
# - LogTo not running
# - Port 3000 already in use
```

## 📚 Quick Reference

### LogTo Endpoints

- Admin Console: http://localhost:3002
- API: http://localhost:3001
- OIDC Discovery: http://localhost:3001/oidc/.well-known/openid-configuration

### App Endpoints

- Home: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Login: http://localhost:3000/api/auth/login
- Health: http://localhost:3000/api/health

### Useful Commands

```bash
# Start everything
docker-compose up -d

# Rebuild app after code changes
docker-compose up -d --build app

# View logs
docker-compose logs -f app

# Restart services
docker-compose restart app logto

# Check status
docker-compose ps
./scripts/validate-infrastructure.sh
```

## ✅ Verification Checklist

Before moving to feature development:

- [ ] LogTo admin account created
- [ ] API Resource created
- [ ] M2M Application created and configured
- [ ] Web Application created and configured
- [ ] Redirect URIs configured correctly
- [ ] Environment variables added to docker-compose.yml
- [ ] NEXTAUTH_SECRET generated and added
- [ ] App container started successfully
- [ ] Can access http://localhost:3000
- [ ] Can sign in and create account
- [ ] Can access /dashboard when authenticated
- [ ] Can sign out successfully
- [ ] Redirected to login when accessing /dashboard while logged out

## 🎉 Once Complete

You'll have:

- ✅ Full authentication flow working
- ✅ Protected routes with middleware
- ✅ User information accessible in app
- ✅ Login/logout functionality
- ✅ Ready to build features with auth!

**Next feature options:**

1. User profile page with editable fields
2. Create post functionality (news feed)
3. Event creation and management
4. User follow/unfollow system

---

**Need help?** Check `LOGTO_SETUP_GUIDE.md` for detailed LogTo configuration steps.
