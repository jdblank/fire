# Fire Platform Infrastructure Template

## Overview

This infrastructure template provides a production-ready foundation for modern web applications with:

- **Authentication**: LogTo (OIDC/OAuth2) with NextAuth.js integration
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and caching
- **Storage**: MinIO (S3-compatible) for file uploads
- **Documentation**: Outline wiki for team collaboration
- **Testing**: Complete test suite (unit, integration, load)
- **CI/CD Ready**: Docker-based development and deployment

## Quick Start: Create a New Project from This Template

### Option 1: GitHub Template (Recommended)

1. **Push this repo to GitHub** (if not already)
2. **Mark as Template Repository**:
   - Go to Settings → Check "Template repository"
3. **Create new projects**:
   - Click "Use this template" → "Create a new repository"

### Option 2: Manual Clone & Setup

```bash
# Clone the template
git clone <this-repo-url> my-new-project
cd my-new-project

# Run the setup script
./scripts/setup-new-project.sh
```

The setup script will:

- ✅ Prompt for project name
- ✅ Update all configuration files
- ✅ Generate new secrets
- ✅ Initialize git repository
- ✅ Set up LogTo applications
- ✅ Run initial tests

## What's Included

### 🏗️ Infrastructure Services (Docker Compose)

```yaml
services:
  - postgres:16-alpine # Database
  - redis:7-alpine # Cache/Sessions
  - minio # S3 Storage
  - logto # Authentication
  - outline # Team Wiki
  - app # Your Next.js app
```

### 🧪 Testing Infrastructure

- **Unit Tests**: Vitest for utility functions
- **Integration Tests**: API and database testing
- **Infrastructure Tests**: Service health checks
- **Load Tests**: k6 for performance testing
- **All tests run in Docker** (no local dependencies)

### 📦 Monorepo Structure

```
your-project/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   ├── db/               # Prisma schema & migrations
│   └── types/            # Shared TypeScript types
├── infrastructure/
│   └── docker/           # Service configurations
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
└── scripts/              # Automation scripts
```

### 🔐 Environment Configuration

- `.env.template` - Environment variable template
- `docker-compose.override.yml` - Local secrets (gitignored)
- Automatic secret generation

## Customizing for Your Project

### 1. Update Project Metadata

Edit these files:

- `package.json` - Project name, description, version
- `apps/web/package.json` - Web app metadata
- `README.md` - Project-specific documentation

### 2. Customize Prisma Schema

```bash
# Edit schema
nano packages/db/prisma/schema.prisma

# Generate migration
npm run db:migrate:docker

# Push to database
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm db-push
```

### 3. Configure Ports (if needed)

Edit `docker-compose.yml` to change ports:

- PostgreSQL: 5432
- Redis: 6379
- MinIO: 9100-9101
- LogTo: 3001-3002
- Outline: 3004
- Your App: 3000

### 4. Add Your Features

The template provides:

- ✅ Authentication flow (login/logout/register)
- ✅ Protected routes with middleware
- ✅ Database models (User, Event, Post, etc.)
- ✅ Type-safe API routes

Build on top with your business logic!

## What Makes This Template Different

### 🚀 Compared to create-next-app:

- ✅ Complete backend infrastructure
- ✅ Authentication pre-configured
- ✅ Database and ORM set up
- ✅ File storage ready
- ✅ Comprehensive testing
- ✅ Production-ready Docker setup

### 🚀 Compared to other templates:

- ✅ Everything runs in Docker (consistent environments)
- ✅ No vendor lock-in (open source stack)
- ✅ Full test coverage from day one
- ✅ LogTo for modern auth (not outdated solutions)
- ✅ Monorepo structure for scalability

## Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js with LogTo OIDC
- **Styling**: Tailwind CSS
- **State**: React Server Components

### Backend

- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)

### DevOps

- **Containers**: Docker Compose
- **Testing**: Vitest + k6
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Ready for observability tools

## Using This Template for Different Types of Apps

### SaaS Application

- ✅ Multi-tenant support ready (add tenant_id to models)
- ✅ Subscription tracking (add to Prisma schema)
- ✅ Usage metering (Redis counters)

### E-commerce Platform

- ✅ Product catalog (extend Post model)
- ✅ File uploads (MinIO for images)
- ✅ Payment integration (Stripe webhook routes ready)

### Social Network

- ✅ User profiles (already in schema)
- ✅ Posts and comments (implemented)
- ✅ File uploads (profile pics, media)
- ✅ Real-time features (add Socket.io)

### Internal Tools

- ✅ Team authentication (LogTo SSO)
- ✅ Documentation (Outline wiki)
- ✅ Admin dashboard (add RBAC)

### API-First Product

- ✅ GraphQL or REST ready
- ✅ API versioning structure
- ✅ Rate limiting (Redis)
- ✅ API documentation (add Swagger/OpenAPI)

## Maintenance & Updates

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update Docker images
docker-compose pull
```

### Database Migrations

```bash
# Create migration
npm run db:migrate

# Apply to production
npm run db:migrate:docker
```

### Run Tests

```bash
# Full test suite
./scripts/test-all-docker.sh

# Individual suites
npm run test:unit
npm run test:integration
npm run test:load
```

## Support & Documentation

- `ARCHITECTURE.md` - System architecture overview
- `TESTING.md` - Testing strategy and commands
- `DEPLOYMENT.md` - Production deployment guide
- `TROUBLESHOOTING.md` - Common issues and solutions

## Next Steps

1. **Customize** the schema for your domain
2. **Build** your features on top
3. **Deploy** using provided Docker setup
4. **Scale** with microservices as needed

---

**Created from**: Fire Platform Infrastructure Template
**License**: MIT (or your choice)
**Maintained by**: Your Team
