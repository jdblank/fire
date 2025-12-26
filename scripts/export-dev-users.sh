#!/bin/bash

# Export users from dev LogTo
# This script exports users from dev LogTo for import to production

set -e

DEV_ENDPOINT="http://auth.fire.local:3001"
M2M_APP_ID="m-default"
M2M_APP_SECRET="default-secret"

echo "🔍 Exporting users from dev LogTo..."
echo ""

# Get M2M token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$DEV_ENDPOINT/oidc/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$M2M_APP_ID&client_secret=$M2M_APP_SECRET&resource=https://default.logto.app/api&scope=all")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Access token obtained"
echo ""

# Export users
echo "Fetching users..."
USERS_RESPONSE=$(curl -s -X GET "$DEV_ENDPOINT/api/users?page=1&page_size=100" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Save to file
echo "$USERS_RESPONSE" > dev-users-export.json
USER_COUNT=$(echo "$USERS_RESPONSE" | jq -r 'length')

echo "✅ Exported $USER_COUNT users to dev-users-export.json"
echo ""

# Show summary
echo "Users exported:"
echo "$USERS_RESPONSE" | jq -r '.[] | "- \(.username) (\(.primaryEmail // "no email"))"'

echo ""
echo "Next step: Run scripts/import-users-to-production.sh"

