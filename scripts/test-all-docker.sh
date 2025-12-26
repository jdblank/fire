#!/bin/bash
# Run all tests in Docker containers
set -e

echo "🔥 Fire Platform - Docker Test Suite"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Check if services are running
echo "📋 Checking infrastructure services..."
if ! docker-compose ps | grep -q "Up"; then
  echo "⚠️  Infrastructure services not running. Starting them..."
  docker-compose up -d
  echo "⏳ Waiting for services to be healthy..."
  sleep 15
fi

echo "✅ Infrastructure services are running"
echo ""

# Run database schema push
echo "🗃️  Setting up Database Schema..."
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm db-push
echo "✅ Database schema ready"
echo ""

# Run tests
echo "🧪 Running Test Suites in Docker..."
echo ""

echo "1️⃣  Unit Tests..."
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-unit
echo ""

echo "2️⃣  Infrastructure Tests..."
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-infrastructure
echo ""

echo "3️⃣  Integration Tests..."
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-integration
echo ""

echo "4️⃣  Load Tests..."
docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-load
echo ""

echo "✅ All tests completed!"
echo ""
echo "📊 Test Summary:"
echo "   - Unit Tests: ✅"
echo "   - Infrastructure Tests: ✅"
echo "   - Integration Tests: ✅"
echo "   - Load Tests: ✅"
echo ""
echo "💡 To run individual test suites:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-unit"
echo "   docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-infrastructure"
echo "   docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-integration"
echo "   docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-load"

