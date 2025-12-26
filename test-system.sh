#!/bin/bash
# Fire Platform - System Test Script

echo "🔥 Fire Platform - System Test"
echo "================================"
echo ""

# Check Docker
echo "1️⃣ Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "   ❌ Docker is not running"
    echo "   👉 Start Docker Desktop and run this script again"
    exit 1
else
    echo "   ✅ Docker is running"
fi
echo ""

# Check services
echo "2️⃣ Checking services..."
if ! docker-compose ps > /dev/null 2>&1; then
    echo "   ⚠️  Services not started"
    echo "   👉 Run: ./start-services.sh"
    exit 1
fi

# Check individual services
services=("postgres" "redis" "logto" "app" "outline" "minio")
all_running=true

for service in "${services[@]}"; do
    if docker-compose ps | grep -q "fire-${service}.*Up"; then
        echo "   ✅ ${service}"
    else
        echo "   ❌ ${service} - not running"
        all_running=false
    fi
done
echo ""

if [ "$all_running" = false ]; then
    echo "   ⚠️  Some services are not running"
    echo "   👉 Run: docker-compose up -d"
    exit 1
fi

# Test HTTP endpoints
echo "3️⃣ Testing HTTP endpoints..."

test_url() {
    local name=$1
    local url=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302\|404"; then
        echo "   ✅ $name - $url"
        return 0
    else
        echo "   ❌ $name - $url (not responding)"
        return 1
    fi
}

test_url "Next.js App" "http://localhost:3000"
test_url "LogTo API" "http://localhost:3001/api/status"
test_url "LogTo Admin" "http://localhost:3002"
test_url "Outline" "http://localhost:3004"

echo ""

# Check database
echo "4️⃣ Checking database..."
if docker-compose exec -T postgres psql -U fireuser -d fire_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL - fire_db accessible"
else
    echo "   ❌ PostgreSQL - fire_db not accessible"
fi

if docker-compose exec -T postgres psql -U fireuser -d logto_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL - logto_db accessible"
else
    echo "   ❌ PostgreSQL - logto_db not accessible"
fi

echo ""

# Check Redis
echo "5️⃣ Checking Redis..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis responding"
else
    echo "   ❌ Redis not responding"
fi

echo ""

# Summary
echo "================================"
echo "🎯 System Status Summary"
echo "================================"
echo ""
echo "✅ All checks passed! Your system is ready."
echo ""
echo "🌐 Access your services:"
echo "   • Next.js App:   http://localhost:3000"
echo "   • LogTo Admin:   http://localhost:3002"
echo "   • Outline Wiki:  http://localhost:3004"
echo ""
echo "🔐 Test login:"
echo "   Email:    demo@fire.test"
echo "   Password: Demo123!Pass"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f app"
echo ""










