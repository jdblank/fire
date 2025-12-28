# Fire Infrastructure Template - Packaging Guide

## Overview

This guide explains how to use the Fire infrastructure as a reusable template for new projects.

## What You've Built

A complete, production-ready infrastructure template with:

✅ **Authentication** - LogTo + NextAuth (OIDC/OAuth2)  
✅ **Database** - PostgreSQL + Prisma ORM  
✅ **Cache** - Redis for sessions  
✅ **Storage** - MinIO (S3-compatible)  
✅ **Documentation** - Outline wiki  
✅ **Testing** - 30 tests (unit, integration, load)  
✅ **Docker** - Complete containerized setup  
✅ **CI/CD Ready** - All tests run in Docker

## Three Ways to Package This

### Option 1: GitHub Template Repository (Easiest)

**Best for:** Teams, open source projects

**Setup:**

1. Push to GitHub (if not already)
2. Go to repository Settings
3. Check ☑️ "Template repository"
4. Done!

**Usage:**

```bash
# Anyone can create a new project:
# 1. Click "Use this template" on GitHub
# 2. Name your new repo
# 3. Clone and run setup script
git clone <new-repo>
cd <new-repo>
./scripts/setup-new-project.sh
```

**Pros:**

- ✅ Easy for others to use
- ✅ GitHub handles versioning
- ✅ Can track template updates
- ✅ Great for teams

**Cons:**

- ⚠️ Requires GitHub
- ⚠️ Public or GitHub Pro for private templates

---

### Option 2: NPX/CLI Tool

**Best for:** Frequent use, developer tools

Create a CLI tool that scaffolds new projects:

```bash
# Future usage (you'd build this):
npx create-fire-app my-new-project
# or
npm create fire-app my-new-project
```

**How to build:**

1. Extract template to separate repo
2. Create Node.js CLI package
3. Publish to npm
4. Users run npx command

**Pros:**

- ✅ Professional developer experience
- ✅ Can prompt for customizations
- ✅ Easy to distribute
- ✅ Version control via npm

**Cons:**

- ⚠️ Requires building CLI tool
- ⚠️ Need to maintain npm package

---

### Option 3: Manual Clone + Script (Current)

**Best for:** Personal use, quick starts

**Setup:**
Nothing needed - already done!

**Usage:**

```bash
# Clone for new project
git clone <this-repo> my-new-project
cd my-new-project

# Run setup script
./scripts/setup-new-project.sh

# Follow prompts to customize
```

**Pros:**

- ✅ Already working
- ✅ Full control
- ✅ Easy to understand

**Cons:**

- ⚠️ Manual cloning
- ⚠️ Git history included
- ⚠️ Need to track updates manually

---

## What Gets Customized

When creating a new project, the setup script updates:

### 1. Project Metadata

- `package.json` → Project name and description
- `apps/web/package.json` → App name
- `packages/*/package.json` → Package names
- `README.md` → Project documentation

### 2. Secrets & Configuration

- Generates new `NEXTAUTH_SECRET`
- Creates `docker-compose.override.yml` template
- Preserves infrastructure config

### 3. Git History

- Option to start fresh git repo
- Removes template-specific files

### 4. What Stays the Same

- ✅ Docker infrastructure
- ✅ Database schema (customizable after)
- ✅ Test suites
- ✅ Authentication flow
- ✅ All documentation

## Using the Template for Different Projects

### SaaS Application

```bash
./scripts/setup-new-project.sh
# Name: my-saas-platform
# Then customize:
# - Add multi-tenancy to Prisma schema
# - Add subscription models
# - Configure payment webhooks
```

### E-commerce Site

```bash
./scripts/setup-new-project.sh
# Name: my-store
# Then customize:
# - Add Product, Order, Cart models
# - Configure MinIO for product images
# - Add payment gateway integration
```

### Internal Tool

```bash
./scripts/setup-new-project.sh
# Name: company-tool
# Then customize:
# - Add team/organization models
# - Configure LogTo SSO for company
# - Add role-based access control
```

### API Backend

```bash
./scripts/setup-new-project.sh
# Name: my-api
# Then customize:
# - Remove Next.js frontend (keep API routes)
# - Add GraphQL or REST API layer
# - Configure rate limiting
```

## Keeping Templates Updated

### Track Upstream Changes

```bash
# In your new project:
git remote add template <original-template-repo>
git fetch template
git merge template/main --allow-unrelated-histories
```

### Version the Template

Tag stable versions in the template repo:

```bash
# In the template repo:
git tag -a v1.0.0 -m "Stable infrastructure template"
git push origin v1.0.0
```

### Document Breaking Changes

Maintain a `CHANGELOG.md` in the template:

- Major version = Breaking changes
- Minor version = New features
- Patch version = Bug fixes

## Customization Checklist

After running setup script, customize these for your project:

### Required:

- [ ] Run `./scripts/setup-new-project.sh`
- [ ] Configure LogTo (see LOGTO_SETUP_GUIDE.md)
- [ ] Update Prisma schema for your domain
- [ ] Run database migrations
- [ ] Update README with project details

### Recommended:

- [ ] Customize landing page (`apps/web/src/app/page.tsx`)
- [ ] Add project logo and branding
- [ ] Configure CI/CD (GitHub Actions provided)
- [ ] Set up production environment
- [ ] Add project-specific tests

### Optional:

- [ ] Add more authentication providers
- [ ] Customize email templates
- [ ] Add analytics/monitoring
- [ ] Configure custom domain
- [ ] Add rate limiting
- [ ] Set up CDN

## Files You Can Safely Delete

When creating a specific project type:

**For API-only projects:**

- Delete: `apps/web/src/app/(auth)/`
- Delete: UI components not needed
- Keep: API routes, database, auth

**For frontend-only:**

- Simplify API routes
- Remove complex business logic
- Keep: Auth, database queries

**For microservices:**

- Extract individual services
- Use docker-compose services independently
- Keep: Shared types and database

## Template Maintenance

### Keep These Generic:

- ✅ Docker configuration
- ✅ Test infrastructure
- ✅ Authentication setup
- ✅ Database structure basics
- ✅ Documentation templates

### Make These Customizable:

- ✅ Prisma models (domain-specific)
- ✅ API routes (business logic)
- ✅ UI components (branding)
- ✅ Environment variables (per project)

## Sharing Your Template

### Make it Public (Open Source)

1. Clean up sensitive data
2. Add LICENSE file
3. Add CODE_OF_CONDUCT.md
4. Add CONTRIBUTING.md
5. Push to GitHub
6. Mark as template
7. Share!

### Keep it Private (Internal)

1. Push to private GitHub repo
2. Mark as template
3. Grant team access
4. Document usage in internal wiki

### Publish as npm Package

1. Extract template logic
2. Create CLI tool
3. Publish to npm
4. Market to developers!

## Success Metrics

Track how well your template works:

✅ **Time to First Deploy**: < 30 minutes  
✅ **Setup Success Rate**: > 95%  
✅ **Customization Time**: < 2 hours  
✅ **Test Pass Rate**: 100% after setup  
✅ **Documentation Clarity**: Newcomers can follow

## Examples of What You Can Build

Using this template as a base:

1. **SaaS Platforms** - Multi-tenant apps with subscriptions
2. **Social Networks** - Posts, comments, likes, follows
3. **E-commerce** - Product catalogs, carts, orders
4. **Internal Tools** - Admin panels, dashboards, CRMs
5. **APIs** - Backend services, microservices
6. **Mobile Backends** - API for React Native / Flutter
7. **IoT Platforms** - Device management, data collection
8. **Educational Platforms** - Courses, assignments, grading
9. **Booking Systems** - Reservations, scheduling
10. **Content Management** - Blogs, wikis, documentation

## Support

Questions about using this template?

- Read: `CREATE_NEW_PROJECT.md`
- Check: `TROUBLESHOOTING.md`
- Review: Example projects (coming soon)

---

**You've built something valuable!** This template saves weeks of setup time for every new project. 🚀
