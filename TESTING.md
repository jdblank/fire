# Testing Guide - Docker-First Approach

All tests run in Docker containers. **No local Node.js/npm required!**

## Quick Start

### Run All Tests

```bash
./scripts/test-all-docker.sh
```

### Run Individual Test Suites

**Infrastructure Tests** (validates all services):

```bash
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-infrastructure
```

**Integration Tests** (database, API, etc.):

```bash
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-integration
```

**Unit Tests** (functions, utilities):

```bash
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-unit
```

## What Gets Tested

### ✅ Infrastructure Tests

Validates all Docker services are operational:

- **PostgreSQL**
  - Connection and authentication
  - Database exists (fire_db, logto_db)
  - Query execution
- **Redis**
  - Connection
  - Key-value operations
  - TTL/expiration
- **MinIO (S3)**
  - Health endpoint
  - Bucket accessibility
- **LogTo (Auth)**
  - Service availability
  - Status API
  - OIDC endpoints
- **Outline (Wiki)**
  - Web interface
  - Application serving

- **Docker Containers**
  - All containers running
  - Health check status
  - Networks created
  - Volumes mounted

### ✅ Integration Tests

- Prisma ORM database operations
- API endpoint responses
- Service-to-service communication

### ✅ Unit Tests

- Utility functions
- Helper methods
- Business logic

## Prerequisites

### Start Infrastructure

```bash
docker-compose up -d
```

This starts:

- PostgreSQL
- Redis
- MinIO
- LogTo
- Outline

### For Database Tests

```bash
# Run migrations first
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm db-migrate
```

## Test Output

Tests will show:

- ✅ **PASS** - Test successful
- ❌ **FAIL** - Test failed
- ⚠️ **WARN** - Service not ready (expected before full setup)

Example output:

```
✓ tests/integration/infrastructure.test.ts (15 tests) 2.5s
  ✓ PostgreSQL Database (3 tests)
  ✓ Redis Cache (2 tests)
  ✓ MinIO S3 Storage (2 tests)
  ✓ LogTo Authentication (3 tests)
  ✓ Outline Wiki (2 tests)
  ✓ Docker Infrastructure (3 tests)
```

## CI/CD Integration

Tests run automatically in GitHub Actions:

- On every PR: Unit + Infrastructure tests
- On merge to main: Full test suite
- Nightly: Performance + load tests

## Troubleshooting

### Tests Failing?

**Check services are running:**

```bash
docker-compose ps
```

**View logs:**

```bash
docker-compose logs -f [service-name]
```

**Restart services:**

```bash
docker-compose restart
```

**Clean start:**

```bash
docker-compose down
docker-compose up -d
sleep 15  # Wait for services
./scripts/test-all-docker.sh
```

### Common Warnings

**"Table does not exist"** (Prisma tests)

- Run migrations: `docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm db-migrate`

**"App not running"** (API tests)

- Uncomment app service in docker-compose.yml
- Run: `docker-compose up -d app`

**"Connection refused"**

- Service not started
- Check: `docker-compose ps`

## Test Development

All tests run in Docker, so you can develop them locally and they'll work the same in CI.

### File Structure

```
tests/
├── unit/              # Fast, isolated tests
├── integration/       # Service integration tests
│   ├── infrastructure.test.ts
│   ├── docker.test.ts
│   ├── prisma.test.ts
│   └── api.test.ts
├── e2e/               # End-to-end browser tests
└── load/              # Performance tests
```

### Add New Tests

Create test files in appropriate directory:

```typescript
// tests/integration/my-feature.test.ts
import { describe, it, expect } from 'vitest'

describe('My Feature', () => {
  it('should work', async () => {
    // Test code
    expect(result).toBe(expected)
  })
})
```

Tests will automatically be picked up and run.

## Performance

- **Unit tests**: ~1-2 seconds
- **Infrastructure tests**: ~5-10 seconds
- **Integration tests**: ~10-15 seconds
- **All tests**: ~30-60 seconds

## Coverage

View test coverage:

```bash
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-integration --coverage
```

Coverage reports generated in `coverage/` directory.

## Summary

✅ **No local setup required** - Everything runs in Docker  
✅ **Validates all infrastructure** - Comprehensive checks  
✅ **Fast feedback** - Tests complete in ~30-60 seconds  
✅ **CI/CD ready** - Same tests run in GitHub Actions  
✅ **Easy to run** - Simple bash script or docker-compose commands

**Run tests regularly to catch issues early!**
