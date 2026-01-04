# Architecture Documentation

## Overview

Fire is a social community platform built with a microservices-inspired architecture, where each service runs in its own Docker container and communicates through well-defined interfaces.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Reverse Proxy                         │
│                      (nginx - future)                        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Next.js   │    │   LogTo     │    │  Outline    │
    │   App      │    │   (Auth)    │    │   (Wiki)    │
    │ :3000      │    │ :3001/3002  │    │   :3003     │
    └─────┬──────┘    └──────┬──────┘    └──────┬──────┘
          │                  │                   │
          └──────────────────┼───────────────────┘
                             │
          ┌──────────────────┼───────────────────┐
          │                  │                   │
    ┌─────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │ PostgreSQL │    │   Redis     │    │   MinIO     │
    │   :5432    │    │   :6379     │    │ :9000/9001  │
    └────────────┘    └─────────────┘    └─────────────┘
```

## Services

### 1. Next.js Application (Port 3000)

**Purpose**: Main web application

**Responsibilities**:

- User interface
- API endpoints
- Server-side rendering
- Business logic

**Key Features**:

- Role-Based Access Control (RBAC) with LogTo integration
- Google Places API integration for location search
- Admin panel for user and role management
- Event management system
- Social news feed
- User profiles with avatars and location data

**Technology**: Next.js 14, React, TypeScript, Prisma

**Databases Used**:

- `fire_db` (PostgreSQL)
- Redis for caching

### 2. LogTo (Ports 3001-3002)

**Purpose**: Authentication and identity management

**Responsibilities**:

- User registration/login
- OAuth/OIDC provider
- Session management
- Multi-factor authentication

**Technology**: LogTo (open-source)

**Database**: `logto_db` (PostgreSQL)

### 3. Outline (Port 3003)

**Purpose**: Wiki and documentation platform

**Responsibilities**:

- Document creation and editing
- Collaboration features
- Search functionality
- Version history

**Technology**: Outline (open-source)

**Databases Used**:

- `outline_db` (PostgreSQL)
- Redis for caching
- MinIO for file storage

### 4. PostgreSQL (Port 5432)

**Purpose**: Primary data store

**Databases**:

- `fire_db`: Main application data
- `logto_db`: Authentication data
- `outline_db`: Wiki data

**Why PostgreSQL?**

- ACID compliance
- Rich feature set (JSON, full-text search)
- Excellent with Prisma ORM
- Proven at scale

### 5. Redis (Port 6379)

**Purpose**: Caching and session storage

**Used By**:

- Next.js (sessions, rate limiting)
- Outline (caching)

**Why Redis?**

- Fast in-memory operations
- Session persistence
- Rate limiting support

### 6. MinIO (Ports 9000-9001)

**Purpose**: Object storage (S3-compatible)

**Buckets**:

- `fire-uploads`: User uploads, avatars, event banners
- `outline-data`: Wiki attachments and images

**Why MinIO?**

- Self-hosted (no cloud costs in dev)
- S3-compatible API
- Easy migration to AWS S3 if needed

## Data Models

### Main Application (`fire_db`)

```
User
├── Profile (1:1)
├── Posts (1:N)
│   └── Comments (1:N)
├── EventRegistrations (1:N)
│   └── Payment (N:1)
└── Payments (1:N)

Event
└── EventRegistrations (1:N)

Upload
└── Metadata for S3 files
```

## Authentication Flow

### Overview

```
1. User clicks "Login"
2. App redirects to LogTo
3. User authenticates with LogTo
4. LogTo redirects back with auth code
5. App exchanges code for tokens
6. User synced to fire_db with roles
7. Session created with JWT
8. User accesses protected resources
```

### NextAuth v5 Split Configuration

**Architecture**: Edge-compatible split between provider config and Node.js callbacks.

#### `auth.config.ts` (Edge-Safe)

- **Purpose**: Provider configuration that can run in Edge runtime
- **Contains**:
  - LogTo OIDC provider setup
  - Manual endpoint specification for Docker networking
  - ES384 JWT algorithm configuration (LogTo uses Elliptic Curve signing)
  - Edge-compatible callbacks (no database access)
- **Why Split**: Middleware runs in Edge runtime, can't access Node.js APIs

#### `auth.ts` (Node.js Only)

- **Purpose**: Extends auth.config with Node.js-specific features
- **Contains**:
  - Database sync callbacks (user upsert on login)
  - Role propagation from LogTo to session
  - Prisma client for user management
- **Why Separate**: Database operations require Node.js runtime

#### Docker Networking Solution

**Problem**: Container can't reach `localhost:3001` for OIDC discovery.

**Solution**: Manual endpoint specification:

```typescript
// Browser uses localhost (user-facing)
authorization: {
  url: 'http://localhost:3001/oidc/auth'
}

// Server uses Docker service name (internal)
token: 'http://logto:3001/oidc/token'
userinfo: 'http://logto:3001/oidc/me'
```

**Result**: Production uses OIDC discovery, dev uses manual endpoints.

### Authorization Architecture (RBAC)

Fire implements a three-tier Role-Based Access Control system using LogTo as the single source of truth for role assignments.

**Architecture Overview**:

```
┌─────────────────────────────────────────────────────────┐
│                    LogTo Identity                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  User: user@example.com                          │   │
│  │  Roles: ["admin"]                                │   │
│  │  LogTo ID: abc123xyz                             │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (JWT Token with roles claim)
         ┌───────────────────────┐
         │   NextAuth Session    │
         │                       │
         │  user: {              │
         │    id: "user-123"     │
         │    email: "user@..."  │
         │    roles: ["admin"]   │  ← From LogTo
         │  }                    │
         └───────────────────────┘
                     │
                     ↓ (hasRole() utility)
         ┌───────────────────────┐
         │  Authorization Check  │
         │                       │
         │  hasRole(user, 'admin')  │
         │  → true                  │
         └───────────────────────┘
```

**Roles Defined in LogTo**:

- `admin`: Full system access, user management, role assignment
- `editor`: Create/edit content, moderate posts, manage events
- `user`: Standard user permissions (default)

**Key Principles**:

1. **LogTo is the Single Source of Truth** - Roles stored in LogTo, not in Fire database
2. **Session-Based Authorization** - Roles included in JWT session token, cached for performance
3. **hasRole() Utility Function** - All authorization checks use `hasRole(user, 'admin')` helper

**Authorization Flow**:

1. User assigned role in LogTo admin console or via Fire admin UI
2. Role included in OIDC `roles` claim during authentication
3. NextAuth maps role to session via `profile()` function
4. Session includes `user.roles` array (cached)
5. API routes and components check roles using `hasRole()` utility
6. Re-authentication required after role changes

**Implementation Files**:

- **Core Utility**: `apps/web/src/lib/utils.ts` - `hasRole()` function
- **Auth Config**: `apps/web/src/auth.config.ts` - NextAuth configuration with roles in JWT
- **Role Management UI**: `apps/web/src/app/admin/users/[userId]/UserRoleManager.tsx`
- **API Endpoints**:
  - `apps/web/src/app/api/admin/users/[userId]/role/route.ts` - Get user role
  - `apps/web/src/app/api/admin/users/role/route.ts` - Update user role
- **Documentation**: `ROLE_MANAGEMENT.md` - Comprehensive role management guide

**Example Usage**:

```typescript
import { hasRole } from '@/lib/utils'
import { auth } from '@/lib/auth'

// Server-side check
const session = await auth()
if (!hasRole(session?.user, 'admin')) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

// Client-side check (UI only)
if (hasRole(session?.user, 'editor')) {
  // Show editor UI
}
```

## File Upload Flow

```
1. User uploads file in browser
2. Next.js API receives file
3. File uploaded to MinIO
4. Upload record created in DB
5. URL returned to user
6. File accessible via MinIO URL
```

## Development Data Flow

```
Developer edits code
    ↓
File saved on Mac
    ↓
Docker volume maps file into container
    ↓
Next.js detects change (hot reload)
    ↓
Browser automatically refreshes
```

## Security Layers

1. **Network**: Docker bridge network isolation
2. **Authentication**: LogTo OIDC
3. **Authorization**: Role-based access control
4. **Input Validation**: Zod schemas
5. **SQL Injection**: Prisma ORM (parameterized queries)
6. **XSS**: React auto-escaping
7. **CSRF**: Token-based protection
8. **Rate Limiting**: Redis-backed

## Scalability Considerations

### Current (Development)

- All services on one machine
- Suitable for 100s of concurrent users

### Future (Production)

- Horizontal scaling of Next.js (multiple containers)
- PostgreSQL replication (read replicas)
- Redis cluster
- MinIO distributed mode or migrate to S3
- Load balancer (nginx/Traefik)
- CDN for static assets

## Monitoring & Logging

### Development

- Docker logs: `docker-compose logs -f`
- Prisma Studio: Database inspection
- MinIO Console: File storage inspection

### Production (Future)

- Application: Sentry, DataDog
- Infrastructure: Prometheus + Grafana
- Logs: ELK Stack or Loki
- Uptime: UptimeRobot, Pingdom

## Backup Strategy

### Development

**Automated System**: See `BACKUP_GUIDE.md` for complete documentation.

**Quick Commands**:

```bash
# Manual backup
./scripts/backup-databases.sh

# Restore from backup
./scripts/restore-databases.sh [timestamp]

# Safe Docker restart (auto-backup)
./scripts/safe-restart.sh
```

**What's Backed Up**:

- `fire_db`: Main application database
- `logto_db`: Authentication database
- Metadata: Git commit, timestamp, file sizes

**Retention**: Last 7 days kept automatically

**Location**: `backups/` (gitignored SQL files)

**Volumes**: Persistent bind mounts to `.docker-data/`

- `.docker-data/postgres` - Database files
- `.docker-data/redis` - Cache data
- `.docker-data/minio` - Object storage

### Production (Future)

- PostgreSQL: Continuous archiving (WAL)
- MinIO: Replication or S3 versioning
- Automated daily backups
- Offsite backup storage

## Testing Strategy

### Unit Tests

- Components: Vitest + React Testing Library
- API endpoints: Vitest
- Utilities: Vitest

### Integration Tests

- API flows: Vitest with test database
- Database operations: Prisma test client

### E2E Tests

- User flows: Playwright
- Run against Docker environment

### Load Tests

- k6 or Artillery
- Test database performance
- Test API rate limits

## Deployment

### Development

```bash
docker-compose up -d
```

### Production (Future)

- Container registry: GitHub Container Registry or Docker Hub
- Orchestration: Docker Swarm or Kubernetes
- CI/CD: GitHub Actions
- Environments: staging → production

## Environment Variables

Critical variables documented in:

- `docker-compose.yml`: Development defaults
- `.env.example`: Template for local overrides
- GitHub Secrets: Production values

## Cost Analysis

### Development

- **Total Cost**: $0 (all self-hosted)
- **Machine Requirements**: 8GB RAM, 20GB disk

### Production (Estimated for 1000 users)

- **Hosting**: $50-100/mo (VPS/cloud)
- **Database**: Included or $20/mo (managed)
- **Storage**: $5-10/mo (100GB)
- **CDN**: $5-20/mo (optional)
- **Total**: $60-150/mo

## Future Enhancements

1. **Real-time Features**
   - WebSocket server for live updates
   - Socket.io or Pusher integration

2. **Search**
   - Elasticsearch or Meilisearch
   - Full-text search across platform

3. **Email**
   - Transactional emails (SendGrid, Resend)
   - Notification system

4. **Payment Processing**
   - Stripe integration for paid events
   - Subscription management

5. **Analytics**
   - PostHog or Plausible
   - User behavior tracking

6. **Mobile Apps**
   - React Native
   - Shared type definitions with web

## API Documentation

Coming soon: OpenAPI/Swagger documentation for all endpoints.

## Contributing

See `CONTRIBUTING.md` for development guidelines.
