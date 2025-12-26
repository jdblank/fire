#!/bin/bash

# Verify Production Setup
# Checks if all production environment variables and services are configured correctly

set -e

echo "🔍 Verifying Production Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if a URL is accessible
check_url() {
  local url=$1
  local name=$2
  
  echo -n "Checking $name... "
  if curl -s -f -o /dev/null --max-time 5 "$url" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
    return 0
  else
    echo -e "${RED}❌${NC}"
    echo "  Error: Cannot access $url"
    ((ERRORS++))
    return 1
  fi
}

# Function to check environment variable
check_env_var() {
  local var_name=$1
  local expected_value=$2
  local is_optional=${3:-false}
  
  echo -n "Checking $var_name... "
  
  # In production, we can't check Vercel env vars directly
  # This is a placeholder for documentation
  if [ "$is_optional" = "true" ]; then
    echo -e "${YELLOW}⚠️  (Optional)${NC}"
    ((WARNINGS++))
  else
    echo -e "${YELLOW}⚠️  (Check in Vercel Dashboard)${NC}"
    echo "  Go to Vercel → Settings → Environment Variables"
    echo "  Verify $var_name is set for Production"
    ((WARNINGS++))
  fi
}

echo "=== Service Accessibility ==="
check_url "https://fire.lemonade.art" "Fire App"
check_url "https://auth.lemonade.art/oidc/.well-known/openid-configuration" "LogTo Well-Known Endpoint"
check_url "https://admin.auth.lemonade.art" "LogTo Admin Console"

echo ""
echo "=== Environment Variables (Verify in Vercel) ==="
echo "Go to: Vercel Dashboard → Your Project → Settings → Environment Variables"
echo ""
check_env_var "NODE_ENV" "production"
check_env_var "NEXTAUTH_URL" "https://fire.lemonade.art"
check_env_var "NEXTAUTH_SECRET" "<generated>"
check_env_var "DATABASE_URL" "<public-postgres-url>"
check_env_var "LOGTO_ENDPOINT" "https://auth.lemonade.art"
check_env_var "LOGTO_ISSUER" "https://auth.lemonade.art/oidc"
check_env_var "LOGTO_APP_ID" "<from-logto>"
check_env_var "LOGTO_APP_SECRET" "<from-logto>"
check_env_var "NEXT_PUBLIC_LOGTO_ENDPOINT" "https://auth.lemonade.art"
check_env_var "LOGTO_M2M_APP_ID" "<optional>" true
check_env_var "LOGTO_M2M_APP_SECRET" "<optional>" true

echo ""
echo "=== LogTo Configuration ==="
echo "Check in LogTo Admin Console: https://admin.auth.lemonade.art"
echo ""
echo -n "Checking LogTo redirect URI... "
echo -e "${YELLOW}⚠️  (Manual check required)${NC}"
echo "  Verify 'Fire' application has redirect URI:"
echo "  https://fire.lemonade.art/api/auth/callback/logto"
((WARNINGS++))

echo ""
echo "=== Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warnings (manual verification needed)${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Verify all environment variables in Vercel Dashboard"
  echo "2. Check LogTo redirect URI configuration"
  echo "3. Test authentication flow at https://fire.lemonade.art"
  exit 0
else
  echo -e "${RED}❌ $ERRORS errors found${NC}"
  echo ""
  echo "Fix the errors above and run this script again."
  exit 1
fi

