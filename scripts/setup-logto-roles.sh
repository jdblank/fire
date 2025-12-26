#!/bin/bash
# Setup LogTo roles using Management API
set -e

echo "🔥 Fire Platform - LogTo Role Setup"
echo "===================================="
echo ""

# Check if docker-compose.override.yml exists
if [ ! -f docker-compose.override.yml ]; then
    echo "❌ Error: docker-compose.override.yml not found"
    echo ""
    echo "This file should contain your LogTo M2M credentials."
    echo "Please ensure LogTo is configured first."
    exit 1
fi

# Extract M2M credentials from override file
export LOGTO_M2M_APP_ID=$(grep "LOGTO_M2M_APP_ID:" docker-compose.override.yml | sed 's/.*: //' | tr -d ' ')
export LOGTO_M2M_APP_SECRET=$(grep "LOGTO_M2M_APP_SECRET:" docker-compose.override.yml | sed 's/.*: //' | tr -d ' ')
export ADMIN_EMAIL=${1:-"josh@lemonade.art"}

if [ -z "$LOGTO_M2M_APP_ID" ] || [ -z "$LOGTO_M2M_APP_SECRET" ]; then
    echo "❌ Error: Could not find LogTo M2M credentials in docker-compose.override.yml"
    echo ""
    echo "Please ensure these are set:"
    echo "  LOGTO_M2M_APP_ID: <your-value>"
    echo "  LOGTO_M2M_APP_SECRET: <your-value>"
    exit 1
fi

echo "📋 Configuration:"
echo "   M2M App ID: ${LOGTO_M2M_APP_ID:0:10}..."
echo "   Admin Email: $ADMIN_EMAIL"
echo ""

# Run the setup script in Docker
docker run --rm \
    --network fire_fire-network \
    -v "$(pwd)/infrastructure/docker/logto:/app" \
    -e LOGTO_ENDPOINT=http://logto:3001 \
    -e LOGTO_M2M_APP_ID="$LOGTO_M2M_APP_ID" \
    -e LOGTO_M2M_APP_SECRET="$LOGTO_M2M_APP_SECRET" \
    -e ADMIN_EMAIL="$ADMIN_EMAIL" \
    node:20-alpine \
    node /app/setup-roles.js

echo ""
echo "✅ Role setup complete!"
echo ""
echo "Next steps:"
echo "  1. Log out of your app"
echo "  2. Log back in"
echo "  3. Go to /admin to access admin panel"
echo ""

