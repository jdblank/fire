#!/bin/bash

echo "🔍 Login Diagnostic Test"
echo "========================"
echo ""

# Get credentials from container
M2M_ID=$(docker exec fire-app printenv LOGTO_M2M_APP_ID)
M2M_SECRET=$(docker exec fire-app printenv LOGTO_M2M_APP_SECRET)

# Get M2M token
echo "1️⃣  Getting M2M token..."
TOKEN=$(curl -s -X POST http://localhost:3001/oidc/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=client_credentials&client_id=$M2M_ID&client_secret=$M2M_SECRET&resource=https://default.logto.app/api&scope=all" \
  | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get M2M token"
  exit 1
fi
echo "✅ Got M2M token"
echo ""

# Check if user exists
echo "2️⃣  Checking if josh@lemonade.art exists in LogTo..."
USER=$(curl -s "http://localhost:3001/api/users?search=josh@lemonade.art" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0]')

if [ "$USER" = "null" ]; then
  echo "❌ User josh@lemonade.art NOT FOUND in LogTo"
  echo ""
  echo "Available users:"
  curl -s "http://localhost:3001/api/users" -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "  - \(.primaryEmail)"' | head -10
  exit 1
fi

USER_ID=$(echo $USER | jq -r '.id')
echo "✅ User found! ID: $USER_ID"
echo ""

# Test password
echo "3️⃣  Testing password verification..."
echo "Enter the password you're trying to use:"
read -s PASSWORD

echo "Testing password against LogTo..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3001/api/users/$USER_ID/password/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

echo ""
if [ "$HTTP_CODE" = "204" ]; then
  echo "✅ PASSWORD IS CORRECT!"
  echo ""
  echo "The password works with LogTo. The issue must be elsewhere."
  echo "Try logging in again at http://localhost:3000/login"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "❌ PASSWORD IS WRONG!"
  echo ""
  echo "LogTo says this password is incorrect."
  echo "Error: $BODY"
  echo ""
  echo "🔧 Fix: Go to http://localhost:3002"
  echo "   → Users → josh@lemonade.art → Set Password"
  echo "   → Set a new simple password like: TestPass123!"
  echo "   → Try again with that password"
else
  echo "⚠️  Unexpected response: HTTP $HTTP_CODE"
  echo "Body: $BODY"
fi












