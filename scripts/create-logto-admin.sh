#!/bin/bash
set -e

# LogTo Configuration
LOGTO_ENDPOINT="http://localhost:3001"
M2M_APP_ID="25bqv5bkc6992sa2phav8"
M2M_APP_SECRET="VKcR6iKmTACHTMG8DaCiBJ7lcHfTxWBW"
MANAGEMENT_API_RESOURCE="https://default.logto.app/api"

# Admin user details
ADMIN_USERNAME="${1:-admin}"
ADMIN_PASSWORD="${2:-Lemonade2006!!!}"
ADMIN_EMAIL="${3:-admin@fire.local}"

echo "🔐 Creating LogTo Admin User..."
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

# Step 2: Create user
echo "2. Creating admin user..."
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${LOGTO_ENDPOINT}/api/users" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${ADMIN_USERNAME}\",
    \"primaryEmail\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"name\": \"Admin User\"
  }")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  USER_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "✅ User created successfully!"
  echo "   User ID: $USER_ID"
  echo ""
  
  # Step 3: Get admin role ID
  echo "3. Finding admin role..."
  ROLES_RESPONSE=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/roles" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
  
  ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -o '"id":"[^"]*"[^}]*"name":"[^"]*admin[^"]*"' | head -1 | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$ADMIN_ROLE_ID" ]; then
    # Try to find any role with admin in the name (case insensitive)
    ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -i "admin" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -n "$ADMIN_ROLE_ID" ]; then
    echo "   Found admin role: $ADMIN_ROLE_ID"
    echo ""
    
    # Step 4: Assign admin role
    echo "4. Assigning admin role..."
    ASSIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${LOGTO_ENDPOINT}/api/users/${USER_ID}/roles" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"roleIds\": [\"${ADMIN_ROLE_ID}\"]}")
    
    ASSIGN_HTTP_CODE=$(echo "$ASSIGN_RESPONSE" | tail -n1)
    
    if [ "$ASSIGN_HTTP_CODE" = "200" ] || [ "$ASSIGN_HTTP_CODE" = "204" ]; then
      echo "✅ Admin role assigned!"
    else
      echo "⚠️  Could not assign admin role (HTTP $ASSIGN_HTTP_CODE)"
      echo "   You may need to assign it manually in the LogTo console"
    fi
  else
    echo "⚠️  Could not find admin role"
    echo "   You may need to assign admin role manually in the LogTo console"
  fi
  
  echo ""
  echo "✅ Admin user created successfully!"
  echo ""
  echo "You can now login at:"
  echo "  - Admin Console: http://localhost:3002"
  echo "  - Sign In: http://auth.fire.local:3001/sign-in"
  echo ""
  echo "Username: $ADMIN_USERNAME"
  echo "Email: $ADMIN_EMAIL"
  echo "Password: $ADMIN_PASSWORD"
  
else
  echo "❌ Failed to create user"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  
  # Check if user already exists
  if echo "$RESPONSE_BODY" | grep -q "already exists\|duplicate"; then
    echo ""
    echo "💡 User might already exist. Trying to update password instead..."
    # Try to find the user and update password
    USERS_RESPONSE=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/users?search=${ADMIN_USERNAME}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    EXISTING_USER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$EXISTING_USER_ID" ]; then
      echo "Found existing user: $EXISTING_USER_ID"
      echo "Updating password..."
      
      PASSWORD_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "${LOGTO_ENDPOINT}/api/users/${EXISTING_USER_ID}/password" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"password\":\"${ADMIN_PASSWORD}\"}")
      
      PASSWORD_HTTP_CODE=$(echo "$PASSWORD_RESPONSE" | tail -n1)
      
      if [ "$PASSWORD_HTTP_CODE" = "200" ] || [ "$PASSWORD_HTTP_CODE" = "204" ]; then
        echo "✅ Password updated successfully!"
        echo ""
        echo "You can now login with:"
        echo "  Username: $ADMIN_USERNAME"
        echo "  Password: $ADMIN_PASSWORD"
      else
        echo "❌ Failed to update password"
      fi
    fi
  fi
  
  exit 1
fi



