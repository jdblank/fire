#!/bin/bash
set -e

# LogTo Configuration
LOGTO_ENDPOINT="http://localhost:3001"
M2M_APP_ID="25bqv5bkc6992sa2phav8"
M2M_APP_SECRET="VKcR6iKmTACHTMG8DaCiBJ7lcHfTxWBW"
ADMIN_USER_ID="k8o30oisr17r"  # Found in database
MANAGEMENT_API_RESOURCE="https://default.logto.app/api"

echo "🔐 Resetting LogTo Admin Password..."
echo ""

# Step 1: Get M2M access token
echo "1. Getting M2M access token..."
TOKEN_RESPONSE=$(curl -s -X POST "${LOGTO_ENDPOINT}/oidc/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${M2M_APP_ID}" \
  -d "client_secret=${M2M_APP_SECRET}" \
  -d "resource=${MANAGEMENT_API_RESOURCE}" \
  -d "scope=all")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got access token"
echo ""

# Step 2: Get password from argument or prompt
echo "2. Setting new password..."
if [ -n "$1" ]; then
  NEW_PASSWORD="$1"
  echo "Using password from argument"
else
  read -sp "Enter new password for admin user: " NEW_PASSWORD
  echo ""
fi

if [ -z "$NEW_PASSWORD" ]; then
  echo "❌ Password cannot be empty"
  exit 1
fi

# Step 3: Update password via Management API
echo "3. Updating password..."
PASSWORD_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "${LOGTO_ENDPOINT}/api/users/${ADMIN_USER_ID}/password" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${NEW_PASSWORD}\"}")

HTTP_CODE=$(echo "$PASSWORD_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PASSWORD_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "✅ Password updated successfully!"
  echo ""
  echo "You can now login at:"
  echo "  - Admin Console: http://localhost:3002"
  echo "  - Sign In: http://auth.fire.local:3001/sign-in"
  echo ""
  echo "Username: admin"
  echo "Password: (the password you just entered)"
else
  echo "❌ Failed to update password"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

