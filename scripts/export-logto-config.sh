#!/bin/bash
set -e

# Export LogTo Configuration from Dev
# This script exports applications, API resources, and their configurations

# Configuration
LOGTO_ENDPOINT="${LOGTO_ENDPOINT:-http://localhost:3001}"
M2M_APP_ID="${LOGTO_M2M_APP_ID:-25bqv5bkc6992sa2phav8}"
M2M_APP_SECRET="${LOGTO_M2M_APP_SECRET:-VKcR6iKmTACHTMG8DaCiBJ7lcHfTxWBW}"
MANAGEMENT_API_RESOURCE="${MANAGEMENT_API_RESOURCE:-https://default.logto.app/api}"
OUTPUT_FILE="${OUTPUT_FILE:-logto-config-export.json}"

echo "📤 Exporting LogTo Configuration..."
echo "Endpoint: $LOGTO_ENDPOINT"
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

# Step 2: Export API Resources
echo "2. Exporting API Resources..."
API_RESOURCES=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/resources" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Filter out the default Management API (we don't need to recreate it)
API_RESOURCES_FILTERED=$(echo "$API_RESOURCES" | jq '[.[] | select(.indicator != "https://default.logto.app/api")]')

echo "✅ Found $(echo "$API_RESOURCES_FILTERED" | jq 'length') custom API resources"
echo ""

# Step 3: Export Applications
echo "3. Exporting Applications..."
APPLICATIONS=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/applications" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "✅ Found $(echo "$APPLICATIONS" | jq 'length') applications"
echo ""

# Step 4: Get detailed info for each application (including assigned resources)
echo "4. Getting detailed application information..."
APPLICATIONS_DETAILED="[]"

for app_id in $(echo "$APPLICATIONS" | jq -r '.[].id'); do
  echo "   Fetching details for application: $app_id"
  APP_DETAIL=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/applications/${app_id}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
  
  # Get assigned API resources for this app
  ASSIGNED_RESOURCES=$(curl -s -X GET "${LOGTO_ENDPOINT}/api/applications/${app_id}/api-resources" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
  
  # Check if ASSIGNED_RESOURCES is valid JSON, if not use empty array
  if ! echo "$ASSIGNED_RESOURCES" | jq . > /dev/null 2>&1; then
    ASSIGNED_RESOURCES="[]"
  fi
  
  # Merge assigned resources into app detail
  APP_WITH_RESOURCES=$(echo "$APP_DETAIL" | jq --argjson resources "$ASSIGNED_RESOURCES" '. + {assignedApiResources: $resources}')
  
  APPLICATIONS_DETAILED=$(echo "$APPLICATIONS_DETAILED" | jq --argjson app "$APP_WITH_RESOURCES" '. + [$app]')
done

echo "✅ Got detailed application information"
echo ""

# Step 5: Combine everything into export file
echo "5. Creating export file..."
EXPORT_DATA=$(jq -n \
  --argjson apiResources "$API_RESOURCES_FILTERED" \
  --argjson applications "$APPLICATIONS_DETAILED" \
  --arg endpoint "$LOGTO_ENDPOINT" \
  --arg exportedAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{
    metadata: {
      exportedAt: $exportedAt,
      sourceEndpoint: $endpoint,
      version: "1.0"
    },
    apiResources: $apiResources,
    applications: $applications
  }')

echo "$EXPORT_DATA" > "$OUTPUT_FILE"

echo "✅ Export complete!"
echo ""
echo "📄 Export saved to: $OUTPUT_FILE"
echo ""
echo "Exported:"
echo "  - $(echo "$API_RESOURCES_FILTERED" | jq 'length') API Resources"
echo "  - $(echo "$APPLICATIONS_DETAILED" | jq 'length') Applications"
echo ""
echo "Next step: Run import-logto-config.sh to import into production"


