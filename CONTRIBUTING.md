# Contributing to Fire Platform

Thank you for your interest in contributing to Fire! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd fire
   ```

2. **Start Docker services**
   ```bash
   npm run docker:up
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Starting Work

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make sure all services are running:
   ```bash
   docker ps
   ```

### While Developing

- Write tests for new features
- Follow the existing code style
- Run linter frequently: `npm run lint`
- Check types: `npm run type-check`
- Run tests: `npm test`

### Code Style

We use:
- **ESLint** for JavaScript/TypeScript linting
- **Prettier** for code formatting
- **TypeScript strict mode** for type safety

Format your code before committing:
```bash
npm run format
```

### Commit Messages

Follow conventional commits:
- `feat: add user profile page`
- `fix: resolve login redirect issue`
- `docs: update API documentation`
- `test: add event registration tests`
- `refactor: simplify authentication logic`
- `chore: update dependencies`

### Testing

Run all tests before submitting:
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

### Submitting a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub
   - Base: `develop`
   - Compare: `feature/your-feature-name`
   - Fill out the PR template
   - Link any related issues

3. **Wait for CI checks** to pass
   - Linting
   - Type checking
   - Tests
   - Security scan
   - Docker build

4. **Request reviews** from maintainers

5. **Address feedback** if needed

6. **Merge** once approved

## Project Structure

```
fire/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/     # App router pages
│       │   ├── components/
│       │   ├── lib/
│       │   └── test/
│       └── Dockerfile.dev
├── packages/
│   ├── db/              # Prisma database
│   └── types/           # Shared types
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── load/
├── infrastructure/
│   └── docker/
└── .github/workflows/   # CI/CD
```

## Architecture Decisions

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture information.

## Database Changes

1. **Modify schema**: Edit `packages/db/prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate`
3. **Generate client**: `npm run db:generate`

## Adding Dependencies

- Use `npm install` (not yarn or pnpm)
- Add to appropriate workspace
- Document why the dependency is needed

## Docker Development

All development happens in Docker containers:

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Rebuild after dependency changes
npm run docker:rebuild

# Clean everything (careful!)
npm run docker:clean
```

## Need Help?

- Open an issue for bugs
- Start a discussion for questions
- Check existing issues and PRs

## Code of Conduct

Be respectful, inclusive, and professional.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


