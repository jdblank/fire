#!/bin/bash
# Quick infrastructure validation script - no npm install needed!
set -e

echo "🔥 Fire Platform - Infrastructure Validation"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

check_service() {
  local name=$1
  local url=$2
  
  echo -n "  Testing $name... "
  if curl -sf "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
  fi
}

check_container() {
  local name=$1
  
  echo -n "  Container $name... "
  if docker ps --filter "name=$name" --filter "status=running" | grep -q "$name"; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
  fi
}

check_postgres() {
  echo -n "  PostgreSQL connection... "
  if docker exec fire-postgres psql -U fireuser -d fire_db -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
  fi
}

check_redis() {
  echo -n "  Redis connection... "
  if docker exec fire-redis redis-cli PING | grep -q "PONG"; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
  fi
}

echo "📦 Docker Containers:"
check_container "fire-postgres"
check_container "fire-redis"
check_container "fire-minio"
check_container "fire-logto"
check_container "fire-outline"
echo ""

echo "🔌 Service Connectivity:"
check_postgres
check_redis
check_service "MinIO" "http://localhost:9100/minio/health/live"
check_service "LogTo" "http://localhost:3001/api/status"
check_service "Outline" "http://localhost:3004"
echo ""

echo "🗄️  Database Checks:"
echo -n "  fire_db exists... "
if docker exec fire-postgres psql -U fireuser -lqt | cut -d \| -f 1 | grep -qw fire_db; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  FAILED=$((FAILED + 1))
fi

echo -n "  logto_db exists... "
if docker exec fire-postgres psql -U fireuser -lqt | cut -d \| -f 1 | grep -qw logto_db; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  FAILED=$((FAILED + 1))
fi

echo -n "  logto_db initialized... "
TABLE_COUNT=$(docker exec fire-postgres psql -U fireuser -d logto_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
if [ "$TABLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} ($TABLE_COUNT tables)"
else
  echo -e "${RED}✗${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "============================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Infrastructure is fully operational and ready for development."
  exit 0
else
  echo -e "${RED}❌ $FAILED check(s) failed${NC}"
  echo ""
  echo "Some services may need attention. Run:"
  echo "  docker-compose ps              # Check container status"
  echo "  docker-compose logs [service]  # View logs"
  echo "  docker-compose restart         # Restart services"
  exit 1
fi

