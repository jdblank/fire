# Fire Platform - Test Suite

Comprehensive test suite to validate all infrastructure components and application functionality.

## Test Structure

```
tests/
├── unit/              # Unit tests for utilities and functions
├── integration/       # Integration tests for infrastructure
│   ├── infrastructure.test.ts  # Service health checks
│   ├── docker.test.ts         # Docker container/volume checks
│   ├── prisma.test.ts         # Database integration
│   └── api.test.ts            # API endpoints
├── e2e/               # End-to-end tests with Playwright
└── load/              # Performance/load tests with k6
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests (Infrastructure Validation)
```bash
npm run test:integration
```

### Infrastructure Health Checks Only
```bash
npm run test:infrastructure
```

### E2E Tests
```bash
npm run test:e2e
```

### Load Tests
```bash
npm run test:load
```

## Test Coverage

### ✅ Infrastructure Tests (`integration/`)

#### Docker Container Tests
- Verifies all containers are running
- Checks container health status
- Validates Docker networks
- Confirms volumes are created

#### PostgreSQL Tests
- Database connectivity
- fire_db database exists
- logto_db database exists and initialized
- SQL query execution

#### Redis Tests
- Connection and authentication
- Key-value operations
- TTL/expiration functionality

#### MinIO Tests
- Health endpoint accessibility
- Bucket existence (fire-uploads)
- S3 API availability

#### LogTo Tests
- Service availability
- Status API endpoint
- OIDC discovery endpoint
- Authentication configuration

#### Outline Tests
- Web interface accessibility
- Application serving

#### Prisma Tests
- Database connection via ORM
- Schema validation
- CRUD operations (after migration)

### ✅ API Tests (`integration/api.test.ts`)

- Health check endpoint (`/api/health`)
- Home page rendering
- JSON response validation

### ✅ E2E Tests (`e2e/`)

- Full user workflows
- Browser-based testing
- Multi-browser support (Chrome, Firefox, Safari, Mobile)

### ✅ Load Tests (`load/`)

- Performance benchmarking
- Concurrent user simulation
- Response time validation
- Error rate monitoring

## Prerequisites

### For Integration Tests
```bash
# Start all infrastructure services
docker-compose up -d

# Services must be running:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - MinIO (ports 9100, 9101)
# - LogTo (ports 3001, 3002)
# - Outline (port 3004)
```

### For API/E2E Tests
```bash
# Additionally start the Next.js app
docker-compose up -d app
# Or uncomment app service in docker-compose.yml
```

### For Prisma Tests
```bash
# Run database migrations first
npm run db:migrate:docker
```

## Test Results

### Expected Results

**Infrastructure Tests** - Should pass if Docker services are running:
- ✅ 15+ infrastructure health checks
- ✅ Docker container validation
- ✅ Service connectivity tests

**Prisma Tests** - Will show warnings before migration:
- ⚠️  Tables not found (before migration)
- ✅ All pass after running migrations

**API Tests** - Require Next.js app running:
- ⚠️  Warnings if app not started
- ✅ All pass when app is running

## CI/CD Integration

Tests are automatically run in GitHub Actions:

- **On PR**: Unit tests, linting, type-check
- **On Merge**: Full test suite including E2E
- **Nightly**: Load tests and full infrastructure validation

## Test Configuration

- **Vitest Config**: `vitest.config.ts`
- **Playwright Config**: `playwright.config.ts`
- **K6 Config**: Embedded in test files

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected)
  })
})
```

### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest'

describe('Service Integration', () => {
  it('should connect to service', async () => {
    const response = await fetch('http://localhost:PORT')
    expect(response.ok).toBe(true)
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="login"]')
  expect(await page.locator('h1').textContent()).toContain('Dashboard')
})
```

## Troubleshooting

### Tests Failing?

1. **Check Docker services are running:**
   ```bash
   docker-compose ps
   ```

2. **View service logs:**
   ```bash
   docker-compose logs -f [service-name]
   ```

3. **Restart services:**
   ```bash
   docker-compose restart
   ```

4. **Clean state:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Common Issues

**"Connection refused"**
- Service not running or wrong port
- Check `docker-compose ps`

**"Table does not exist"**
- Migrations not run yet
- Run: `npm run db:migrate:docker`

**"Container not found"**
- Docker containers not started
- Run: `docker-compose up -d`

## Test Maintenance

- Update tests when adding new features
- Keep integration tests focused on interfaces, not implementation
- Use meaningful test descriptions
- Clean up test data after tests
- Mock external services when appropriate

## Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All infrastructure components
- **E2E Tests**: Critical user paths
- **Load Tests**: Performance benchmarks documented

