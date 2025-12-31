#!/bin/bash
echo "Running Database Migrations..."
# Go up two levels to find packages
cd ../../packages/db
# Run migration
pnpm exec prisma migrate deploy
echo "Building Web App..."
# Go back to the web app folder
cd ../../apps/web
# Build
next build
