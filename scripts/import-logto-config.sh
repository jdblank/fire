#!/bin/bash
set -e

# Import LogTo Configuration to Production
# This script imports applications and API resources from an export file

# Configuration
LOGTO_ENDPOINT="${LOGTO_ENDPOINT:-https://auth.lemonade.art}"
M2M_APP_ID="${LOGTO_M2M_APP_ID}"
M2M_APP_SECRET="${LOGTO_M2M_APP_SECRET}"
MANAGEMENT_API_RESOURCE="${MANAGEMENT_API_RESOURCE:-https://default.logto.app/api}"
INPUT_FILE="${INPUT_FILE:-logto-config-export.json}"

# URL mappings (dev -> production)
DEV_ENDPOINT="${DEV_ENDPOINT:-http://auth.fire.local:3001}"
PROD_ENDPOINT="${PROD_ENDPOINT:-https://auth.lemonade.art}"
DEV_APP_URL="${DEV_APP_URL:-http://app.fire.local:3000}"
PROD_APP_URL="${PROD_APP_URL:-https://fire.lemonade.art}"
DEV_API_RESOURCE="${DEV_API_RESOURCE:-https://api.fire-platform.local}"
PROD_API_RESOURCE="${PROD_API_RESOURCE:-https://api.fire-platform.com}"

# Check required parameters
if [ -z "$M2M_APP_ID" ] || [ -z "$M2M_APP_SECRET" ]; then
  echo "❌ Error: LOGTO_M2M_APP_ID and LOGTO_M2M_APP_SECRET must be set"
  echo ""
  echo "Usage:"
  echo "  LOGTO_ENDPOINT=https://auth.lemonade.art \\"
  echo "  LOGTO_M2M_APP_ID=your-m2m-app-id \\"
  echo "  LOGTO_M2M_APP_SECRET=your-m2m-app-secret \\"
  echo "  ./scripts/import-logto-config.sh"
  exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ Error: Export file not found: $INPUT_FILE"
  echo "Run export-logto-config.sh first to create the export file"
  exit 1
fi

echo "📥 Importing LogTo Configuration..."
echo "Endpoint: $LOGTO_ENDPOINT"
echo "Input file: $INPUT_FILE"
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

# Step 2: Import API Resources
echo "2. Importing API Resources..."
API_RESOURCE_COUNT=$(jq '.apiResources | length' "$INPUT_FILE")

for i in $(seq 0 $((API_RESOURCE_COUNT - 1))); do
  api_resource=$(jq -c ".apiResources[$i]" "$INPUT_FILE")
  NAME=$(echo "$api_resource" | jq -r '.name')
  INDICATOR=$(echo "$api_resource" | jq -r '.indicator')
  
  # Replace dev URLs with production URLs
  INDICATOR=$(echo "$INDICATOR" | sed "s|${DEV_API_RESOURCE}|${PROD_API_RESOURCE}|g")
  
  echo "   Creating API Resource: $NAME ($INDICATOR)"
  
  # Get scopes (if they exist in the export, otherwise use empty array)
  SCOPES=$(echo "$api_resource" | jq '.scopes // []')
  
  # Create API Resource
  CREATE_PAYLOAD=$(jq -n \
    --arg name "$NAME" \
    --arg indicator "$INDICATOR" \
    --argjson scopes "$SCOPES" \
    '{
      name: $name,
      indicator: $indicator,
      scopes: $scopes
    }')
  
  CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${LOGTO_ENDPOINT}/api/resources" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD")
  
  HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    NEW_RESOURCE_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
    echo "   ✅ Created API Resource (ID: $NEW_RESOURCE_ID)"
  else
    # Check if it already exists
    if echo "$RESPONSE_BODY" | grep -q "already exists\|duplicate"; then
      echo "   ⚠️  API Resource already exists, skipping..."
      # Try to find existing resource
      EXISTING_RESOURCES=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/resources" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
      NEW_RESOURCE_ID=$(echo "$EXISTING_RESOURCES" | jq -r ".[] | select(.indicator == \"$INDICATOR\") | .id")
    else
      echo "   ❌ Failed to create API Resource"
      echo "   HTTP Code: $HTTP_CODE"
      echo "   Response: $RESPONSE_BODY"
      exit 1
    fi
  fi
done

echo "✅ Imported $API_RESOURCE_COUNT API Resources"
echo ""

# Step 3: Import Applications
echo "3. Importing Applications..."
APP_COUNT=$(jq '.applications | length' "$INPUT_FILE")

for i in $(seq 0 $((APP_COUNT - 1))); do
  application=$(jq -c ".applications[$i]" "$INPUT_FILE")
  NAME=$(echo "$application" | jq -r '.name')
  TYPE=$(echo "$application" | jq -r '.type')
  
  echo "   Creating Application: $NAME (Type: $TYPE)"
  
  # Prepare application payload
  if [ "$TYPE" = "MachineToMachine" ]; then
    # M2M Application
    CREATE_PAYLOAD=$(jq -n \
      --arg name "$NAME" \
      '{
        name: $name,
        type: "MachineToMachine"
      }')
  else
    # Traditional Web Application
    OIDC_METADATA=$(echo "$application" | jq '.oidcClientMetadata // {}')
    
    # Replace dev URLs with production URLs in redirect URIs
    REDIRECT_URIS=$(echo "$OIDC_METADATA" | jq -r '.redirectUris[]?' | \
      sed "s|${DEV_APP_URL}|${PROD_APP_URL}|g" | \
      sed "s|http://localhost:3000|${PROD_APP_URL}|g")
    
    POST_LOGOUT_URIS=$(echo "$OIDC_METADATA" | jq -r '.postLogoutRedirectUris[]?' | \
      sed "s|${DEV_APP_URL}|${PROD_APP_URL}|g" | \
      sed "s|http://localhost:3000|${PROD_APP_URL}|g")
    
    CREATE_PAYLOAD=$(jq -n \
      --arg name "$NAME" \
      --argjson redirectUris "$(echo "$REDIRECT_URIS" | jq -R . | jq -s .)" \
      --argjson postLogoutUris "$(echo "$POST_LOGOUT_URIS" | jq -R . | jq -s .)" \
      '{
        name: $name,
        type: "Traditional",
        oidcClientMetadata: {
          redirectUris: $redirectUris,
          postLogoutRedirectUris: $postLogoutUris
        }
      }')
  fi
  
  # Create Application
  CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${LOGTO_ENDPOINT}/api/applications" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD")
  
  HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    NEW_APP_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
    NEW_APP_SECRET=$(echo "$RESPONSE_BODY" | jq -r '.secret // .clientSecret // ""')
    echo "   ✅ Created Application (ID: $NEW_APP_ID)"
    
    if [ -n "$NEW_APP_SECRET" ]; then
      echo "   🔑 App Secret: $NEW_APP_SECRET (SAVE THIS!)"
    fi
    
    # Step 4: Assign API Resources to Application
    ASSIGNED_RESOURCES=$(echo "$application" | jq -r '.assignedApiResources[]?.id // empty')
    
    if [ -n "$ASSIGNED_RESOURCES" ]; then
      echo "   Assigning API Resources..."
      
      # Get all available resources (including the ones we just created)
      ALL_RESOURCES=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/resources" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
      
      # Map old resource IDs to new ones by indicator
      for old_resource_id in $ASSIGNED_RESOURCES; do
        # Get the old resource indicator from export
        OLD_INDICATOR=$(echo "$application" | jq -r ".assignedApiResources[] | select(.id == \"$old_resource_id\") | .indicator")
        
        # Replace dev URLs with production URLs
        NEW_INDICATOR=$(echo "$OLD_INDICATOR" | sed "s|${DEV_API_RESOURCE}|${PROD_API_RESOURCE}|g")
        
        # Find the new resource ID by indicator
        NEW_RESOURCE_ID=$(echo "$ALL_RESOURCES" | jq -r ".[] | select(.indicator == \"$NEW_INDICATOR\") | .id")
        
        if [ -n "$NEW_RESOURCE_ID" ] && [ "$NEW_RESOURCE_ID" != "null" ]; then
          # Assign the resource
          ASSIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
            "${LOGTO_ENDPOINT}/api/applications/${NEW_APP_ID}/api-resources/${NEW_RESOURCE_ID}" \
            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d '{"scopeIds": ["all"]}')
          
          ASSIGN_HTTP_CODE=$(echo "$ASSIGN_RESPONSE" | tail -n1)
          
          if [ "$ASSIGN_HTTP_CODE" = "200" ] || [ "$ASSIGN_HTTP_CODE" = "204" ]; then
            echo "   ✅ Assigned API Resource: $NEW_INDICATOR"
          else
            echo "   ⚠️  Failed to assign API Resource: $NEW_INDICATOR"
          fi
        fi
      done
    fi
  else
    echo "   ❌ Failed to create Application"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    exit 1
  fi
  
  echo ""
done

echo "✅ Import complete!"
echo ""
echo "Imported:"
echo "  - $API_RESOURCE_COUNT API Resources"
echo "  - $APP_COUNT Applications"
echo ""
echo "⚠️  IMPORTANT: Save all Application IDs and Secrets shown above!"
echo "You'll need them for your Vercel environment variables."


