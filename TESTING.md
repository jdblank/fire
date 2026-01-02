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

## Component Testing

### Running Component Tests

Component tests validate React components in isolation using Vitest and React Testing Library:

```bash
# From the web app directory
cd apps/web
npm run test

# Watch mode for development
npm run test:watch

# With coverage
npm run test:coverage
```

### React Testing Library Patterns

**Basic Component Rendering:**

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

**User Interactions:**

```typescript
import { fireEvent } from '@testing-library/react'

test('handles button click', () => {
  render(<MyButton onClick={mockFn} />)
  const button = screen.getByRole('button')
  fireEvent.click(button)
  expect(mockFn).toHaveBeenCalled()
})
```

**Async Operations:**

```typescript
import { waitFor } from '@testing-library/react'

test('loads data', async () => {
  render(<DataComponent />)
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Mocking API Calls

**Global fetch mock:**

```typescript
import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

test('fetches data', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: 'test' }),
  } as Response)

  render(<Component />)
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/endpoint')
  })
})
```

**Mocking External Libraries:**

```typescript
// Mock use-places-autocomplete
vi.mock('use-places-autocomplete', () => ({
  default: () => ({
    ready: true,
    value: '',
    suggestions: { status: 'OK', data: [] },
    setValue: vi.fn(),
    clearSuggestions: vi.fn(),
  }),
  getGeocode: vi.fn(),
  getLatLng: vi.fn(),
}))
```

### Example Component Tests

See these files for comprehensive examples:

- `apps/web/src/components/__tests__/UserRoleManager.test.tsx` - Form interactions, API mocking, state management
- `apps/web/src/components/__tests__/LocationAutocomplete.test.tsx` - External library mocking, props validation

### Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and does
2. **Use semantic queries** - Prefer `getByRole()`, `getByLabelText()` over `getByTestId()`
3. **Mock external dependencies** - API calls, third-party libraries
4. **Keep tests focused** - One logical assertion per test
5. **Use waitFor for async** - Never use arbitrary timeouts

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
