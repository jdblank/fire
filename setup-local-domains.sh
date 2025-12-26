#!/bin/bash

echo "Setting up local domain names for Fire..."
echo ""
echo "This will add entries to /etc/hosts (requires sudo)"
echo ""

# Check if entries already exist
if grep -q "fire.local" /etc/hosts 2>/dev/null; then
  echo "✓ Entries already exist in /etc/hosts"
else
  echo "Adding entries to /etc/hosts..."
  sudo bash -c 'cat >> /etc/hosts << EOF

# Fire Platform Local Development
127.0.0.1 app.fire.local
127.0.0.1 auth.fire.local
EOF'
  echo "✓ Added to /etc/hosts"
fi

echo ""
echo "✅ Local domains configured!"
echo ""
echo "You can now access:"
echo "  - Fire App:  http://app.fire.local:3000"
echo "  - LogTo Auth: http://auth.fire.local:3001"
echo ""
echo "Next: Update docker-compose.override.yml to use these domains"


