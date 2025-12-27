#!/bin/bash

# NextAuth v4 to v5 Migration Script
# This script migrates API routes from getServerSession(authOptions) to auth()

echo "Starting NextAuth v4 to v5 migration..."

# Find all TypeScript files in the API routes
find apps/web/src/app/api -name "*.ts" -type f | while read -r file; do
  # Check if file contains getServerSession
  if grep -q "getServerSession" "$file"; then
    echo "Migrating: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Replace the imports
    sed -i "s/import { getServerSession } from 'next-auth'//" "$file"
    sed -i "s/import { authOptions } from '@\/lib\/auth'/import { auth } from '@\/auth'/" "$file"
    
    # Replace the usage
    sed -i "s/getServerSession(authOptions)/auth()/g" "$file"
    
    # Clean up any double empty lines
    sed -i '/^$/N;/^\n$/D' "$file"
  fi
done

echo "Migration complete!"
echo "Backup files created with .backup extension"
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Run: pnpm build"
echo "3. Run: pnpm test:integration"
echo "4. If successful, remove backup files: find apps/web/src/app/api -name '*.backup' -delete"
