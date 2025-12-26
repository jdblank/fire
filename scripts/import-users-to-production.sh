#!/bin/bash

# Import users to production LogTo
# This script imports users exported from dev

set -e

PROD_ENDPOINT="https://auth.lemonade.art"
M2M_APP_ID="w4gfwzeo8b49uodfwebe6"
M2M_APP_SECRET="fdcHwbz4m7UeKzdXxtgTFL2PRdnPvlcr"
INPUT_FILE="dev-users-export.json"

if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ File $INPUT_FILE not found"
  echo "Run scripts/export-dev-users.sh first"
  exit 1
fi

echo "🔍 Importing users to production LogTo..."
echo ""

# Get M2M token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$PROD_ENDPOINT/oidc/token" \
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

# Import each user
USER_COUNT=$(jq -r 'length' "$INPUT_FILE")
echo "Importing $USER_COUNT users..."
echo ""

for i in $(seq 0 $((USER_COUNT - 1))); do
  USER=$(jq -c ".[$i]" "$INPUT_FILE")
  USERNAME=$(echo "$USER" | jq -r '.username')
  EMAIL=$(echo "$USER" | jq -r '.primaryEmail // empty')
  
  echo "Creating user: $USERNAME ($EMAIL)"
  
  # Create user (LogTo will auto-generate password, user must reset)
  CREATE_RESPONSE=$(curl -s -X POST "$PROD_ENDPOINT/api/users" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"primaryEmail\": \"$EMAIL\",
      \"name\": $(echo "$USER" | jq '.name // null')
    }")
  
  NEW_USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')
  
  if [ -n "$NEW_USER_ID" ]; then
    echo "  ✅ Created user with ID: $NEW_USER_ID"
  else
    echo "  ❌ Failed to create user"
    echo "  Response: $CREATE_RESPONSE"
  fi
  echo ""
done

echo "✅ User import complete!"
echo ""
echo "⚠️  Note: Users will need to reset their passwords"
echo "   They can use the 'Forgot Password' link"

