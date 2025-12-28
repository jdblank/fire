# Fire - Social Community Platform

A modern, lightweight social community platform with event management, user profiles, news feeds, and integrated documentation.

---

## 🚀 Quick Start

**New here?** → **[START HERE](START_HERE.md)** ← Complete setup guide

**Production Setup** → **[PRODUCTION STATUS](PRODUCTION_STATUS.md)** ← Live deployment info

**Need to configure LogTo?** → **[LOGTO SETUP GUIDE](LOGTO_SETUP_GUIDE.md)**

**Testing** → **[TESTING.md](TESTING.md)** ← Run tests in Docker

---

## Features

- 🔐 **Authentication**: LogTo integration with OIDC
- 👤 **User Profiles**: Customizable profiles with avatars
- 📰 **News Feed**: Social posting and interactions
- 📅 **Event Management**: Free and paid event registration
- 📚 **Wiki**: Outline-based documentation platform
- 🐳 **Docker-First**: Complete development environment in containers

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Auth**: LogTo
- **Wiki**: Outline
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest, Playwright, k6

## Environments

### Development

- **App:** http://app.fire.local:3000
- **LogTo Admin:** http://localhost:3002/console
- Run with: `docker-compose up`

### Production

- **App:** https://fire.lemonade.art
- **LogTo Admin:** https://admin.auth.lemonade.art
- Auto-deploys from `main` branch via Vercel webhook

## Getting Started

### Prerequisites

- Docker Desktop for Mac
- Git

### Initial Setup

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd fire
   ```

2. **Start all services**:

   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be ready** (first time takes 2-3 minutes):

   ```bash
   docker-compose logs -f
   ```

4. **Access the services**:
   - **Main App**: http://localhost:3000
   - **LogTo Admin**: http://localhost:3002
   - **Outline Wiki**: http://localhost:3003
   - **MinIO Console**: http://localhost:9001 (user: minioadmin, pass: minioadmin123)

### Development Workflow

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down

# Rebuild containers after changes
npm run docker:rebuild

# Run database migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Project Structure

```
fire/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/        # App router pages
│       │   ├── components/ # React components
│       │   └── lib/        # Utilities
│       └── Dockerfile.dev
├── packages/
│   ├── db/                 # Prisma schema & migrations
│   ├── ui/                 # Shared UI components
│   └── types/              # Shared TypeScript types
├── infrastructure/
│   └── docker/             # Docker configuration
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── load/             # Load tests
└── docker-compose.yml
```

## Database Schema

The platform includes:

- Users and authentication
- User profiles
- Posts and comments (news feed)
- Events and registrations
- Payment records
- File uploads

## Environment Variables

All environment variables are configured in `docker-compose.yml`. For production, use proper secrets management.

### Key Variables:

- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `S3_*`: MinIO/S3 configuration
- `LOGTO_*`: Authentication settings
- `NEXTAUTH_SECRET`: Session encryption key

## Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Load tests (coming soon)
# npm run test:load
```

## CI/CD

GitHub Actions workflows are configured for:

- Linting and testing on PRs
- Security scanning
- Docker image building
- Automated deployment

## Security

- All passwords/secrets should be changed for production
- HTTPS required in production
- Rate limiting enabled
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS protection via React

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
