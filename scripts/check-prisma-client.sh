#!/bin/bash

# Check if Prisma client is in sync with schema
# This script verifies that the Prisma client has been generated

set -e

echo "🔍 Checking Prisma client..."

# Check if Prisma client exists
if [ ! -d "node_modules/.prisma/client" ]; then
  echo "⚠️  Prisma client not found. Generating..."
  cd packages/db
  pnpm exec prisma generate
  cd ../..
  echo "✅ Prisma client generated"
else
  # Check if schema is newer than client
  SCHEMA_TIME=$(stat -f "%m" packages/db/prisma/schema.prisma 2>/dev/null || stat -c "%Y" packages/db/prisma/schema.prisma 2>/dev/null || echo "0")
  CLIENT_TIME=$(stat -f "%m" node_modules/.prisma/client/index.d.ts 2>/dev/null || stat -c "%Y" node_modules/.prisma/client/index.d.ts 2>/dev/null || echo "0")
  
  if [ "$SCHEMA_TIME" -gt "$CLIENT_TIME" ]; then
    echo "⚠️  Prisma schema is newer than client. Regenerating..."
    cd packages/db
    pnpm exec prisma generate
    cd ../..
    echo "✅ Prisma client regenerated"
  else
    echo "✅ Prisma client is up to date"
  fi
fi

