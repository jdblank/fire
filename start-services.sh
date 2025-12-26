#!/bin/bash
# Fire Platform - Start All Services

echo "🔥 Starting Fire Platform..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop any existing containers
echo "📦 Cleaning up existing containers..."
docker-compose down 2>/dev/null

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to start..."
echo ""

# Wait for postgres
echo -n "Waiting for PostgreSQL..."
while ! docker-compose exec -T postgres pg_isready -U fireuser > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Wait for LogTo
echo -n "Waiting for LogTo..."
while ! curl -s http://localhost:3001/api/status > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Wait for app
echo -n "Waiting for Next.js app..."
while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

echo ""
echo "🎉 All services are running!"
echo ""
echo "📱 Access your services:"
echo "   • Next.js App:      http://localhost:3000"
echo "   • LogTo Admin:      http://localhost:3002"
echo "   • Outline Wiki:     http://localhost:3004"
echo "   • MinIO Console:    http://localhost:9101"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f app"
echo ""
echo "🛑 Stop all services:"
echo "   docker-compose down"
echo ""










