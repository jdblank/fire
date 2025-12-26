#!/bin/bash
# Setup script for creating a new project from Fire Infrastructure Template
set -e

echo "🔥 Fire Platform Infrastructure Template"
echo "========================================"
echo ""
echo "This script will help you set up a new project from this template."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prompt for project details
read -p "Enter project name (e.g., my-awesome-app): " PROJECT_NAME
read -p "Enter project description: " PROJECT_DESC
read -p "Enter project author/organization: " PROJECT_AUTHOR

# Convert project name to different formats
PROJECT_SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
PROJECT_TITLE=$(echo "$PROJECT_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')

echo ""
echo -e "${BLUE}Project Configuration:${NC}"
echo "  Name: $PROJECT_TITLE"
echo "  Slug: $PROJECT_SLUG"
echo "  Description: $PROJECT_DESC"
echo "  Author: $PROJECT_AUTHOR"
echo ""
read -p "Proceed with setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Starting setup..."
echo ""

# Step 1: Generate secrets
echo "1️⃣  Generating secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET generated"

# Step 2: Update package.json
echo ""
echo "2️⃣  Updating package.json files..."
sed -i.bak "s/\"name\": \"fire\"/\"name\": \"$PROJECT_SLUG\"/" package.json
sed -i.bak "s/\"description\": \".*\"/\"description\": \"$PROJECT_DESC\"/" package.json
sed -i.bak "s/\"name\": \"@fire\/web\"/\"name\": \"@$PROJECT_SLUG\/web\"/" apps/web/package.json
sed -i.bak "s/\"name\": \"@fire\/db\"/\"name\": \"@$PROJECT_SLUG\/db\"/" packages/db/package.json
sed -i.bak "s/\"name\": \"@fire\/types\"/\"name\": \"@$PROJECT_SLUG\/types\"/" packages/types/package.json
rm -f package.json.bak apps/web/package.json.bak packages/db/package.json.bak packages/types/package.json.bak
echo -e "${GREEN}✓${NC} Package files updated"

# Step 3: Create docker-compose.override.yml template
echo ""
echo "3️⃣  Creating docker-compose.override.yml template..."
cat > docker-compose.override.yml.template <<EOF
# Local development overrides - DO NOT COMMIT
# Copy this to docker-compose.override.yml and fill in values after LogTo setup

services:
  app:
    environment:
      # NextAuth
      NEXTAUTH_SECRET: $NEXTAUTH_SECRET
      
      # LogTo Web Application (User Auth)
      # Get these from LogTo Admin Console after setup
      LOGTO_APP_ID: <your-web-app-id>
      LOGTO_APP_SECRET: <your-web-app-secret>
      
      # LogTo Management API (M2M)
      # Get these from LogTo Admin Console after setup
      LOGTO_M2M_APP_ID: <your-m2m-app-id>
      LOGTO_M2M_APP_SECRET: <your-m2m-app-secret>
EOF
echo -e "${GREEN}✓${NC} Template created: docker-compose.override.yml.template"

# Step 4: Update README
echo ""
echo "4️⃣  Updating README..."
cat > README.md <<EOF
# $PROJECT_TITLE

$PROJECT_DESC

Built with [Fire Platform Infrastructure Template](https://github.com/yourorg/fire)

## Quick Start

\`\`\`bash
# Start all services
docker-compose up -d

# Run database migrations
npm run db:migrate:docker

# Run tests
./scripts/test-all-docker.sh

# Access your app
open http://localhost:3000
\`\`\`

## Services

- **Web App**: http://localhost:3000
- **LogTo Admin**: http://localhost:3002
- **MinIO Console**: http://localhost:9101
- **Outline Wiki**: http://localhost:3004
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Testing](./TESTING.md)
- [Deployment](./DEPLOYMENT.md)
- [LogTo Setup](./LOGTO_SETUP_GUIDE.md)

## Tech Stack

- Next.js 14 + TypeScript
- PostgreSQL + Prisma
- Redis
- MinIO (S3)
- LogTo + NextAuth
- Docker

## Project Structure

\`\`\`
$PROJECT_SLUG/
├── apps/web/              # Next.js application
├── packages/
│   ├── db/                # Prisma schema
│   └── types/             # Shared types
├── infrastructure/        # Docker configs
├── tests/                 # Test suites
└── scripts/               # Automation
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
\`\`\`

## Next Steps

1. Configure LogTo (see LOGTO_SETUP_GUIDE.md)
2. Customize Prisma schema
3. Build your features!

---

**Author**: $PROJECT_AUTHOR
**Created**: $(date +%Y-%m-%d)
EOF
echo -e "${GREEN}✓${NC} README.md updated"

# Step 5: Initialize Git (if not already)
echo ""
echo "5️⃣  Git repository setup..."
if [ -d .git ]; then
    echo -e "${YELLOW}⚠${NC}  Git repository already exists"
    read -p "Remove existing git history and start fresh? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .git
        git init
        echo -e "${GREEN}✓${NC} Fresh git repository initialized"
    fi
else
    git init
    echo -e "${GREEN}✓${NC} Git repository initialized"
fi

# Step 6: Clean up template-specific files
echo ""
echo "6️⃣  Cleaning up template files..."
rm -f COMMIT_SUMMARY.md SESSION_SUMMARY.md
if [ -f LOGTO_CREDENTIALS.md ]; then
    rm -f LOGTO_CREDENTIALS.md
fi
echo -e "${GREEN}✓${NC} Template files cleaned"

# Step 7: Install dependencies
echo ""
echo "7️⃣  Installing dependencies..."
read -p "Install npm dependencies now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Skipped - run 'npm install' manually"
fi

# Step 8: Summary and next steps
echo ""
echo -e "${GREEN}✓✓✓ Setup Complete! ✓✓✓${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review the configuration:"
echo "   - package.json updated with project name"
echo "   - README.md customized"
echo "   - NEXTAUTH_SECRET generated: $NEXTAUTH_SECRET"
echo ""
echo "2. Start the infrastructure:"
echo "   ${BLUE}docker-compose up -d${NC}"
echo ""
echo "3. Set up LogTo authentication:"
echo "   - Open: http://localhost:3002"
echo "   - Follow: LOGTO_SETUP_GUIDE.md"
echo "   - Copy docker-compose.override.yml.template → docker-compose.override.yml"
echo "   - Fill in LogTo credentials"
echo ""
echo "4. Initialize the database:"
echo "   ${BLUE}npm run db:migrate:docker${NC}"
echo ""
echo "5. Run tests to verify:"
echo "   ${BLUE}./scripts/test-all-docker.sh${NC}"
echo ""
echo "6. Start developing:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "📚 Documentation:"
echo "   - Architecture: ARCHITECTURE.md"
echo "   - Testing: TESTING.md"
echo "   - Deployment: DEPLOYMENT.md"
echo "   - LogTo Setup: LOGTO_SETUP_GUIDE.md"
echo ""
echo "🎉 Happy coding!"
echo ""

