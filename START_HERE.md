# 🔥 Fire Platform - START HERE

**Current Status**: System is configured and ready to start  
**Last Updated**: October 21, 2025

## ⚡ Quick Start (Do This Now!)

### Step 1: Start Docker Desktop

1. Open **Docker Desktop** application on your Mac
2. Wait for Docker to fully start (watch for the Docker icon in menu bar)
3. Verify Docker is running: `docker info`

### Step 2: Start All Services

```bash
./start-services.sh
```

This will:

- Start PostgreSQL, Redis, MinIO, LogTo, Outline, and the Next.js app
- Wait for all services to be healthy
- Display URLs when ready

**Expected wait time**: 30-60 seconds

### Step 3: Verify Everything is Running

```bash
./test-system.sh
```

This will check:

- ✅ Docker is running
- ✅ All containers are up
- ✅ HTTP endpoints responding
- ✅ Database connections working

### Step 4: Test Login

Open browser and go to: **http://localhost:3000/login**

**Test Credentials** (demo account):

- Email: `demo@fire.test`
- Password: `Demo123!Pass`

**OR** register a new account: **http://localhost:3000/register**

## 🎯 What Should Happen

After successful login, you should see:

1. Dashboard with welcome message
2. Your name and role displayed
3. Quick stats cards
4. Profile information
5. Quick action buttons

## 🔧 Your Configuration Status

✅ **All credentials are configured** in `docker-compose.override.yml`:

- NEXTAUTH_SECRET
- LOGTO_APP_ID (Web App)
- LOGTO_APP_SECRET
- LOGTO_M2M_APP_ID (Machine-to-Machine)
- LOGTO_M2M_APP_SECRET

✅ **Authentication is implemented** and working:

- Custom login/register forms
- LogTo password verification via Management API
- NextAuth session management
- Role-based access control (USER, ADMIN, MODERATOR)

## 🌐 Service Access

Once running:

- **Next.js App**: http://localhost:3000
- **LogTo Admin Console**: http://localhost:3002
- **Outline Wiki**: http://localhost:3004
- **MinIO Console**: http://localhost:9101
  - Username: `minioadmin`
  - Password: `minioadmin123`

## 🐛 Troubleshooting

### Problem: Docker daemon not running

**Solution**: Start Docker Desktop and wait for it to fully load

### Problem: Port already in use

**Solution**:

```bash
# Find what's using the port (e.g., 3000)
lsof -i :3000

# Kill the process or change the port in docker-compose.yml
```

### Problem: "Invalid email or password"

**Solution**:

1. Go to LogTo Admin: http://localhost:3002
2. Navigate to: **Users** → find your user
3. Click **"Set Password"**
4. Set a new password (e.g., `TestPass123!`)
5. Use that exact password to login

### Problem: Services won't start

**Solution**:

```bash
# View logs to see what's wrong
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d
```

### Problem: Prisma client errors

**Solution**:

```bash
# Regenerate Prisma client inside container
docker-compose exec app npx prisma generate

# Restart the app
docker-compose restart app
```

### Problem: LogTo redirect issues

**Solution**:

1. Go to LogTo Admin: http://localhost:3002
2. Navigate to: **Applications** → **Fire Platform Web**
3. Under **Redirect URIs**, ensure you have:
   - `http://localhost:3000/api/auth/callback/logto`
4. Under **Post Sign-out Redirect URIs**, ensure you have:
   - `http://localhost:3000`

## 📊 Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just LogTo
docker-compose logs -f logto
```

### Check Service Status

```bash
docker-compose ps
```

### Restart a Service

```bash
docker-compose restart app
docker-compose restart logto
```

### Stop Everything

```bash
docker-compose down
```

### Complete Reset (removes all data)

```bash
docker-compose down -v
./start-services.sh
```

### Access Database

```bash
# Fire app database
docker-compose exec postgres psql -U fireuser -d fire_db

# LogTo database
docker-compose exec postgres psql -U fireuser -d logto_db
```

## 🎉 Success Checklist

After following this guide, you should have:

- [ ] Docker Desktop running
- [ ] All services started (`docker-compose ps` shows 6+ services)
- [ ] http://localhost:3000 loads the app
- [ ] http://localhost:3002 loads LogTo admin
- [ ] Can login with demo account or new registration
- [ ] Dashboard displays after login
- [ ] User profile shows name and role

## 📚 Next Steps

Once everything is working:

1. **Create Admin Users** (see `LOGTO_SETUP_GUIDE.md`)
   - Go to LogTo Admin
   - Create roles (admin, moderator)
   - Assign roles to users

2. **Explore the Architecture** (see `ARCHITECTURE.md`)
   - Understand the system design
   - Review the tech stack
   - Plan your features

3. **Start Building Features**
   - Authentication is ready
   - Database is connected
   - Storage (MinIO) is configured
   - Wiki (Outline) is available

4. **Run Tests** (see `TESTING.md`)
   - Unit tests: `docker-compose exec app npm test`
   - E2E tests: `npm run test:e2e`
   - Integration tests: `npm run test:integration`

## 🆘 Still Having Issues?

1. **Check Docker Desktop is running**:

   ```bash
   docker info
   ```

2. **Verify all containers are up**:

   ```bash
   docker-compose ps
   ```

3. **Check the logs**:

   ```bash
   docker-compose logs -f app
   ```

4. **Test LogTo directly**:
   - Visit: http://localhost:3002
   - Should see LogTo admin login

5. **Check if ports are available**:
   ```bash
   lsof -i :3000,3001,3002,5432
   ```

## 📖 Additional Documentation

- `GET_IT_WORKING.md` - Detailed troubleshooting guide
- `LOGTO_SETUP_GUIDE.md` - Complete LogTo configuration walkthrough
- `ARCHITECTURE.md` - System architecture and design
- `TESTING.md` - Testing strategies and commands
- `DEPLOYMENT.md` - Production deployment guide

---

**Remember**: The user rule is to "always build in Docker, never in the local Mac environment". All development happens inside Docker containers! 🐳

**Ready to start?** Run:

```bash
./start-services.sh
```
