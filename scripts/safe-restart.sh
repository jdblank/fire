#!/bin/bash
# Safe Docker/OrbStack restart with automatic backup
# Usage: ./scripts/safe-restart.sh

set -e

echo "🔥 Fire Platform - Safe Restart"
echo "==============================="
echo ""

# Step 1: Backup
echo "📦 Step 1/3: Creating backup..."
./scripts/backup-databases.sh
echo ""

# Step 2: Stop services
echo "🛑 Step 2/3: Stopping services..."
docker-compose down
echo "✅ Services stopped"
echo ""

# Step 3: Instructions
echo "✅ Step 3/3: Ready to restart"
echo ""
echo "You can now safely:"
echo "  - Restart OrbStack"
echo "  - Restart Docker"
echo "  - Reboot your machine"
echo ""
echo "After restart, run:"
echo "  docker-compose up -d"
echo ""
echo "If data is lost, restore with:"
echo "  ./scripts/restore-databases.sh [timestamp]"
echo ""
echo "Latest backup timestamp: $(ls -t backups/*.meta | head -1 | sed 's/.*backup_//' | sed 's/.meta//')"
