#!/bin/sh
set -e

echo "🔥 Starting LogTo initialization..."

# Wait for PostgreSQL to be ready (simple TCP check)
echo "Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  sleep 1
done

echo "✓ PostgreSQL is ready!"

# LogTo will auto-initialize the database on first run
# Just start it normally
cd /etc/logto
echo "Starting LogTo..."
exec npm run start

