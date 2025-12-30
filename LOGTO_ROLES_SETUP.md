# LogTo Role-Based Access Control Setup

## Overview

LogTo is your **Identity and Access Management (IAM)** system. It should manage:

- ✅ User authentication (login/logout)
- ✅ User roles (ADMIN, MODERATOR, USER)
- ✅ Role assignments
- ✅ Claims in JWT tokens

Your Next.js app reads roles from LogTo and enforces authorization.

---

## Step 1: Create Roles in LogTo

1. **Go to LogTo Admin Console**: http://localhost:3002
2. **Navigate to**: Roles (in left sidebar under AUTHORIZATION)
3. **Create three roles**:

### Role 1: User (Default)

- **Name**: `user`
- **Description**: Regular platform user
- **Permissions**: Basic access

### Role 2: Moderator

- **Name**: `moderator`
- **Description**: Can moderate content and manage events
- **Permissions**: Content moderation, event management

### Role 3: Admin

- **Name**: `admin`
- **Description**: Full platform access
- **Permissions**: All permissions, user management

---

## Step 2: Assign Admin Role to Your Account

1. **Go to**: User Management (left sidebar)
2. **Find your user**: josh@lemonade.art
3. **Click** on the user
4. **Go to**: Roles tab
5. **Assign role**: `admin`
6. **Save**

---

## Step 3: Configure Role Claims

LogTo includes roles in the ID token automatically, but we need to ensure our app reads them:

1. **Go to**: Applications → Fire (your web app)
2. **Settings** → **Advanced settings**
3. **Custom claims** (if available):
   - Add `roles` to returned claims
4. **Save**

---

## Step 4: Update Next.js to Read LogTo Roles

Our NextAuth configuration should extract roles from LogTo's ID token:

```typescript
// In auth.ts - NextAuth config
callbacks: {
  async jwt({ token, account, profile }) {
    if (account && profile) {
      // LogTo returns roles in the profile/ID token
      token.role = profile.roles?.[0] || 'user'
    }
    return token
  },
  async session({ session, token }) {
    session.user.role = token.role
    return session
  }
}
```

---

## How It Works

```
User Logs In
     ↓
LogTo authenticates
     ↓
Returns ID token with roles claim
     ↓
NextAuth extracts role from token
     ↓
Session includes user role
     ↓
App checks role for authorization
```

---

## Advantages of LogTo-Managed Roles

✅ **Single source of truth** - Roles defined in one place  
✅ **Centralized management** - LogTo admin console  
✅ **Token-based** - No extra database queries  
✅ **Scalable** - Works across multiple apps  
✅ **Secure** - IAM best practices  
✅ **Audit trail** - LogTo logs role changes

---

## Alternative: Use LogTo's Management API

For programmatic role assignment, use the Management API:

```bash
# Get M2M token
curl -X POST http://localhost:3001/oidc/token \
  -d grant_type=client_credentials \
  -d client_id=YOUR_M2M_APP_ID \
  -d client_secret=YOUR_M2M_APP_SECRET \
  -d resource=https://default.logto.app/api

# Assign role to user
curl -X POST http://localhost:3001/api/users/{userId}/roles \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"roleIds": ["role-id"]}'
```

---

## Migration Plan

If you already have users with database roles:

1. **Create roles in LogTo** (as above)
2. **Sync existing roles** from database to LogTo
3. **Update NextAuth** to read from LogTo
4. **Remove database role column** (Done)

---

## Quick Setup for Testing

**Manual approach** (for your first admin):

1. Open LogTo console: http://localhost:3002
2. Go to Users → josh@lemonade.art
3. Assign role: `admin`
4. Log out and back in to your app
5. Done! ✅

---

**Do you want me to help you:**

1. Update NextAuth to properly read roles from LogTo tokens?
2. Create a script to setup roles via LogTo Management API?
3. Keep the current database approach (simpler but not best practice)?

**What's your preference?**
