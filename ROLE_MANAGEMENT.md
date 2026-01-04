# Role Management Guide

**Status:** ✅ Active
**Last Updated:** January 2, 2026

## Overview

Fire implements a three-tier Role-Based Access Control (RBAC) system using LogTo as the source of truth for role assignments. Roles are managed entirely in LogTo's identity platform and are included in the user's session via JWT claims.

## Table of Contents

- [Role Definitions](#role-definitions)
- [Architecture](#architecture)
- [Managing Roles](#managing-roles)
- [Code Examples](#code-examples)
- [Technical Implementation](#technical-implementation)
- [Troubleshooting](#troubleshooting)
- [Migration Notes](#migration-notes)
- [Security Considerations](#security-considerations)

---

## Role Definitions

### USER (Default Role)

**Permissions:**

- View public content
- Create and manage own posts
- Register for events
- Update own profile
- View wiki content

**Use Case:** Regular community members

### EDITOR

**Permissions:**

- All USER permissions, plus:
- Create and edit events
- Moderate posts and comments
- Manage wiki pages
- View analytics dashboard

**Use Case:** Content creators and community moderators

### ADMIN

**Permissions:**

- All EDITOR permissions, plus:
- Manage user accounts
- Assign roles to other users
- Access admin panel
- Configure system settings
- View all user data

**Use Case:** Platform administrators

---

## Architecture

### Source of Truth: LogTo

```
┌─────────────────────────────────────────────────────────┐
│                    LogTo Identity                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  User: josh@lemonade.art                         │   │
│  │  Roles: ["admin"]                                │   │
│  │  LogTo ID: amys6q4nfr6n                          │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (JWT Token with roles claim)
         ┌───────────────────────┐
         │   NextAuth Session    │
         │                       │
         │  user: {              │
         │    id: "user-123"     │
         │    email: "josh@..."  │
         │    roles: ["admin"]   │  ← From LogTo
         │  }                    │
         └───────────────────────┘
                     │
                     ↓ (hasRole() utility)
         ┌───────────────────────┐
         │  Authorization Check  │
         │                       │
         │  hasRole(user, 'admin')  │
         │  → true                  │
         └───────────────────────┘
```

### Key Principles

1. **LogTo is the Single Source of Truth**
   - Roles are stored in LogTo, not in the Fire database
   - Database contains no `role` field (removed in migration `20260102174053_remove_role_field`)

2. **Session-Based Authorization**
   - Roles are included in the JWT session token
   - Session is cached for performance
   - Re-authentication required after role changes

3. **hasRole() Utility Function**
   - All authorization checks use `hasRole(user, 'admin')`
   - Never access `user.role` directly (no longer exists)
   - Works with user.roles array from session

---

## Managing Roles

### Via Fire Admin UI

**Prerequisites:**

- You must be logged in as an admin
- Target user must have completed registration (has `logtoId`)

**Steps:**

1. Navigate to **Admin → Users**
2. Click **Edit** on the user you want to manage
3. Scroll to the **User Role** section
4. Select desired role from dropdown:
   - User (default)
   - Editor
   - Admin
5. Click **Update Role**
6. User must **log out and log back in** for changes to take effect

**Restrictions:**

- Admins cannot change their own role
- User must have a LogTo ID (must accept invite first)

### Via API

#### Get User's Current Role

```bash
GET /api/admin/users/{userId}/role
```

**Authorization:** Admin only

**Response:**

```json
{
  "role": "USER" | "EDITOR" | "ADMIN"
}
```

#### Update User's Role

```bash
POST /api/admin/users/role
Content-Type: application/json

{
  "userId": "<logto-user-id>",
  "role": "USER" | "EDITOR" | "ADMIN"
}
```

**Authorization:** Admin only

**Restrictions:**

- Cannot change own role (returns 400)
- Target role must exist in LogTo (returns 404)

**Success Response:**

```json
{
  "success": true,
  "message": "User role updated to ADMIN in LogTo. User must log out and back in for changes to take effect."
}
```

### Via LogTo Admin Console

1. Go to [LogTo Admin Console](http://localhost:3002/console) (dev) or [https://admin.auth.lemonade.art](https://admin.auth.lemonade.art) (prod)
2. Navigate to **User Management → Users**
3. Click on the user
4. Go to **Roles** tab
5. Remove existing role (if any)
6. Click **Assign Roles** and select new role
7. User must log out and log back in

---

## Code Examples

### Check if User Has a Role

```typescript
import { hasRole } from '@/lib/utils'
import { auth } from '@/lib/auth'

// In a server component or API route
export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for admin role
  if (!hasRole(session.user, 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin-only logic here
  return Response.json({ data: 'admin data' })
}
```

### Client-Side Role Check

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { hasRole } from '@/lib/utils'

export function AdminButton() {
  const { data: session } = useSession()

  // Don't show button to non-admins
  if (!hasRole(session?.user, 'admin')) {
    return null
  }

  return <button>Admin Action</button>
}
```

### Protect an Entire Page

```typescript
// app/admin/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { hasRole } from '@/lib/utils'

export default async function AdminPage() {
  const session = await auth()

  if (!hasRole(session?.user, 'admin')) {
    redirect('/unauthorized')
  }

  return <div>Admin Dashboard</div>
}
```

### Multiple Role Check

```typescript
import { hasRole } from '@/lib/utils'

// Check if user is editor OR admin
function canModerateContent(user: { roles?: string[] }) {
  return hasRole(user, 'editor') || hasRole(user, 'admin')
}

// Usage
if (canModerateContent(session.user)) {
  // Show moderation UI
}
```

### Wrong Way (Don't Do This)

```typescript
// ❌ WRONG - Database role field no longer exists
if (session.user.role === 'ADMIN') { ... }

// ❌ WRONG - Direct property access
if (session.user.roles.includes('admin')) { ... }

// ✅ CORRECT - Use hasRole utility
if (hasRole(session.user, 'admin')) { ... }
```

---

## Technical Implementation

### Files Involved

#### Core Utilities

- **`apps/web/src/lib/utils.ts`** - `hasRole()` function
- **`apps/web/src/lib/auth.ts`** - NextAuth configuration with roles in JWT

#### API Routes

- **`apps/web/src/app/api/admin/users/[userId]/role/route.ts`** - Get user role
- **`apps/web/src/app/api/admin/users/role/route.ts`** - Update user role

#### Components

- **`apps/web/src/app/admin/users/[userId]/UserRoleManager.tsx`** - Role management UI

#### Database

- **`packages/db/prisma/schema.prisma`** - User model (no role field)
- **`packages/db/prisma/migrations/20260102174053_remove_role_field/`** - Migration that removed role

#### Tests

- **`apps/web/src/lib/__tests__/role-utils.test.ts`** - `hasRole()` tests
- **`tests/integration/user-schema-validation.test.ts`** - Schema validation
- **`apps/web/src/components/__tests__/UserRoleManager.test.tsx`** - UI tests

### hasRole() Implementation

```typescript
// apps/web/src/lib/utils.ts
export function hasRole(user: { roles?: string[] } | null | undefined, role: string): boolean {
  return user?.roles?.includes(role) ?? false
}
```

**Features:**

- Null-safe (returns false for null/undefined users)
- Works with missing roles array (returns false)
- Case-sensitive matching
- Simple and fast

### Role Mapping

LogTo uses lowercase role names, but our codebase uses uppercase enum-style names:

| Our Format | LogTo Format |
| ---------- | ------------ |
| USER       | user         |
| EDITOR     | editor       |
| ADMIN      | admin        |

**API endpoints handle this mapping automatically.**

### Session Structure

```typescript
{
  user: {
    id: string            // Our database user ID
    email: string
    logtoId: string       // LogTo user ID
    roles: string[]       // From LogTo (e.g., ["admin"])
    // NO "role" property
  },
  expires: string
}
```

---

## Troubleshooting

### User's Role Not Updating After Assignment

**Problem:** Role was changed in LogTo or Fire admin, but user still has old permissions.

**Solution:**

1. User must **log out completely** (not just close tab)
2. User must **log back in** to get new JWT token with updated roles
3. Session tokens are cached - old token is still valid until expiration

**Alternative:** Clear browser cookies for the site.

### "Cannot change own role" Error

**Problem:** Admin trying to change their own role.

**Reason:** This is a security feature to prevent accidental lockout.

**Solution:**

- Have another admin change your role
- Or use LogTo admin console directly
- Cannot be bypassed via API

### "Role not found in LogTo" Error

**Problem:** Role doesn't exist in LogTo identity provider.

**Solution:**
Run the LogTo setup script:

```bash
npm run logto:setup-roles
```

Or create roles manually in LogTo admin console:

1. Navigate to **Roles**
2. Create three roles: `user`, `editor`, `admin` (lowercase)
3. Set type to "User" (not "Machine")

### User Has No Role (Shows USER by Default)

**Problem:** User completed registration but has no role assigned.

**Reason:** New users don't automatically get roles assigned.

**Solution:**

- Users default to USER role when no role is assigned
- Manually assign role via Fire admin UI or LogTo console
- Run `npm run logto:setup-roles` to assign admin to initial user

### hasRole() Returns False Unexpectedly

**Checklist:**

1. ✅ User is logged in? (`session.user` exists)
2. ✅ User has `roles` array? (check `session.user.roles`)
3. ✅ Role name matches exactly? (case-sensitive: `'admin'` not `'Admin'`)
4. ✅ User logged out and back in after role change?

**Debug:**

```typescript
console.log('User:', session?.user)
console.log('Roles:', session?.user?.roles)
console.log('Has admin?', hasRole(session?.user, 'admin'))
```

---

## Migration Notes

### From Database Roles to LogTo Roles

**Date:** January 2, 2026
**Migration:** `20260102174053_remove_role_field`

**Changes:**

- ❌ Removed `role` field from `User` model
- ❌ Removed `UserRole` enum
- ✅ All role checks now use `hasRole(user, 'role')`
- ✅ Roles stored exclusively in LogTo

**Breaking Changes:**

- `user.role` no longer exists
- Cannot use `UserRole.ADMIN` enum
- Database queries cannot filter by role

**Migration Path:**

**Before:**

```typescript
// ❌ Old way (no longer works)
const user = await prisma.user.findUnique({ where: { id } })
if (user.role === 'ADMIN') { ... }
```

**After:**

```typescript
// ✅ New way
const session = await auth()
if (hasRole(session.user, 'admin')) { ... }
```

### Checking Existing Code

**Find potential issues:**

```bash
# Search for old direct role access
grep -r "user.role" apps/web/src/

# Search for UserRole enum usage
grep -r "UserRole\." apps/web/src/

# Find WHERE clauses that filter by role
grep -r "where.*role" apps/web/src/
```

---

## Security Considerations

### Why LogTo for Roles?

1. **Centralized Identity Management**
   - One source of truth across services
   - Consistent with authentication flow
   - Easier audit trail

2. **Separation of Concerns**
   - Identity layer handles authorization
   - Application layer enforces based on claims
   - Database layer stores business data only

3. **Token-Based Security**
   - Roles embedded in signed JWT
   - Cannot be tampered with client-side
   - Validated on every request

### Best Practices

1. **Always Use `hasRole()`**
   - Don't access `user.roles` directly
   - Consistent null-checking
   - Easier to refactor later

2. **Server-Side Checks Only for Security**
   - Client-side checks are for UX only
   - Always validate on API routes
   - Never trust client-side role checks

3. **Require Re-Authentication**
   - After role changes, force logout
   - Don't try to update session in-place
   - Ensures token consistency

4. **Principle of Least Privilege**
   - Give users minimum role needed
   - Elevate temporarily if needed
   - Audit admin actions

5. **Role Assignment Restrictions**
   - Admins can't change own role
   - Prevents accidental lockout
   - Requires second admin for safety

### Security Audit

**Questions to Ask:**

- [ ] Are all admin routes protected with `hasRole(user, 'admin')`?
- [ ] Are role checks performed server-side (API routes, server components)?
- [ ] Is client-side role UI purely for UX (not security)?
- [ ] Do users log out after role changes?
- [ ] Are role names in LogTo correct (lowercase)?
- [ ] Is the M2M app properly scoped in LogTo?

---

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [LogTo Documentation](https://docs.logto.io/)
- [LogTo Management API](https://docs.logto.io/api/)
- [LOGTO_SETUP_GUIDE.md](./LOGTO_SETUP_GUIDE.md) - Initial LogTo configuration
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) - Authentication architecture

---

## Summary

**Key Takeaways:**

✅ Roles are managed in LogTo, not in Fire's database
✅ Use `hasRole(session.user, 'role')` for all authorization
✅ Users must log out and back in after role changes
✅ Three roles: USER (default), EDITOR, ADMIN
✅ Admin UI available at `/admin/users/[userId]`
✅ Roles cannot be changed via database queries

**Common Mistakes:**

❌ Accessing `user.role` directly (doesn't exist)
❌ Filtering database by role (no longer possible)
❌ Expecting immediate role updates (requires re-auth)
❌ Using uppercase role names in LogTo (must be lowercase)

---

**Last Updated:** January 2, 2026
**Questions?** Open a GitHub issue or check [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)
