#!/bin/bash

echo "🔥 Setting up Fire development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop."
  exit 1
fi

echo "✅ Docker is running"

# Start services
echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

services=("postgres:5432" "redis:6379" "minio:9000")
for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  if docker-compose ps | grep -q "$name.*Up"; then
    echo "✅ $name is running"
  else
    echo "❌ $name failed to start"
  fi
done

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Access your services:"
echo "   Main App:      http://localhost:3000"
echo "   LogTo Admin:   http://localhost:3002"
echo "   Outline Wiki:  http://localhost:3003"
echo "   MinIO Console: http://localhost:9001"
echo ""
echo "📚 Next steps:"
echo "   1. Run database migrations: npm run db:migrate"
echo "   2. Configure LogTo at http://localhost:3002"
echo "   3. Start developing!"
echo ""
echo "💡 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Rebuild:       docker-compose up -d --build"
















