# Role-Based Access Control (RBAC) Implementation

## Architecture Overview

This system implements **proper IAM architecture** where LogTo is the single source of truth for roles and permissions.

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   LogTo     │  roles  │  NextAuth    │  auth   │  Next.js App │
│    (IAM)    │────────>│  (Session)   │────────>│     (UI)     │
└─────────────┘         └──────────────┘         └──────────────┘
      │                                                   │
      │ Management API                                    │
      │<──────────────────────────────────────────────────┘
      │  (Role changes, user management)
```

---

## How It Works

### 1. **LogTo (IAM Layer)**
- ✅ Manages user identities
- ✅ Defines roles (`admin`, `moderator`, `user`)
- ✅ Assigns roles to users
- ✅ Returns roles in authentication responses

### 2. **NextAuth (Auth Layer)**
- ✅ Authenticates users via LogTo
- ✅ Fetches user roles from LogTo Management API
- ✅ Includes roles in JWT token and session
- ✅ Provides session to app

### 3. **Next.js App (Authorization Layer)**
- ✅ Reads roles from session
- ✅ Protects routes based on roles
- ✅ Shows/hides UI elements based on roles
- ✅ Manages roles via LogTo Management API

### 4. **Database (Cache Layer)**
- ✅ Stores user data for queries and relationships
- ✅ Caches role for faster access (synced from LogTo)
- ✅ Links users to posts, events, etc.

---

## Roles Defined

### 👤 USER (Default)
**Permissions:**
- View public content
- Create posts and comments
- Register for events
- Edit own profile

### 👮 MODERATOR
**Permissions:**
- All USER permissions
- Moderate posts and comments
- Manage events
- View moderation dashboard

### 🔥 ADMIN
**Permissions:**
- All MODERATOR permissions
- Manage user roles
- Access admin panel
- Platform configuration
- Full system access

---

## Implementation Details

### Initial Role Setup

Roles are created programmatically via LogTo's Management API:

```bash
npm run logto:setup-roles
```

This script:
1. Connects to LogTo Management API
2. Creates three roles (user, moderator, admin)
3. Assigns admin role to josh@lemonade.art
4. Returns role IDs for reference

**Script location**: `/infrastructure/docker/logto/setup-roles.js`

---

### Authentication Flow

```typescript
// User logs in → NextAuth authorize() function
1. Verify password with LogTo
2. Fetch user's roles from LogTo API
3. Map role to our enum (admin → ADMIN)
4. Create/update user in database (cache)
5. Return user with role to NextAuth
6. NextAuth includes role in JWT token
7. Role available in session.user.role
```

**Code**: `apps/web/src/lib/auth.ts`

---

### Role Management

Admins can change user roles via the admin panel:

```
Admin UI → API call → LogTo Management API → Role updated
                  ↓
             Database cache updated
```

**API endpoint**: `/api/admin/users/role`  
**UI**: `/admin/users/[userId]`

---

## Usage in Code

### Check Role in Server Component

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Page() {
  const session = await getServerSession(authOptions)
  
  if (session?.user.role === 'ADMIN') {
    // Show admin content
  }
}
```

### Check Role in Client Component

```typescript
'use client'
import { useSession } from 'next-auth/react'

export function Component() {
  const { data: session } = useSession()
  
  if (session?.user.role === 'ADMIN') {
    return <AdminFeature />
  }
}
```

### Protect API Route

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Admin-only logic
}
```

### Middleware Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request })
  
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (session?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
}
```

---

## Features Implemented

### ✅ Non-Logged-In Landing Page
- Beautiful hero section
- Feature showcase
- Call-to-action buttons
- **Location**: `/apps/web/src/app/page.tsx`

### ✅ Logged-In Dashboard
- Personalized welcome
- Role badge display
- Quick stats (posts, events, connections)
- Admin quick actions (admins only)
- Activity feed
- System status
- **Location**: `/apps/web/src/app/dashboard/page.tsx`

### ✅ Admin User Management
- List all users with filtering
- View user details and activity
- Change user roles via UI
- Role statistics
- **Location**: `/apps/web/src/app/admin/users/page.tsx`

### ✅ Individual User Management
- Detailed user profile view
- Role change form with permissions preview
- Activity summary
- Account actions
- **Location**: `/apps/web/src/app/admin/users/[userId]/page.tsx`

---

## Testing Role-Based Access

### Test as Regular User
1. Create a test account (not josh@lemonade.art)
2. Log in
3. Should see:
   - ✅ Dashboard with USER badge
   - ❌ No admin menu
   - ❌ Cannot access /admin routes

### Test as Admin
1. Log in as josh@lemonade.art
2. Should see:
   - ✅ Dashboard with ADMIN badge
   - ✅ Admin quick actions panel
   - ✅ Admin menu in navigation
   - ✅ Can access /admin/users
   - ✅ Can change other users' roles

---

## Role Management Commands

### Create Roles (One-time setup)
```bash
npm run logto:setup-roles
```

### Promote User to Admin
```bash
# Via script
./scripts/setup-logto-roles.sh user@example.com

# Via admin UI
# Login as admin → /admin/users → Select user → Change role
```

### Check User's Role in LogTo
```bash
# Via LogTo console
http://localhost:3002 → Users → Select user → Roles tab
```

---

## Security Considerations

### ✅ Implemented
- Roles managed in IAM system (LogTo)
- Role checks in API routes
- Role checks in UI components
- Cannot change own role (prevented)
- Admin-only endpoints protected

### 📋 Recommended
- Add audit log for role changes
- Implement permission granularity
- Add role change notifications
- Rate limit role change API
- Add 2FA requirement for admin actions

---

## Database Schema

The database caches roles for performance and relationships:

```prisma
model User {
  id    String   @id
  email String   @unique
  role  UserRole @default(USER)  // Synced from LogTo
  // ... other fields
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}
```

**Why cache roles?**
- ✅ Faster queries (no LogTo API call needed)
- ✅ Foreign key relationships (posts, events)
- ✅ Offline reporting
- ✅ LogTo remains source of truth (synced on login)

---

## Current Admin

**User**: josh@lemonade.art  
**Role**: ADMIN  
**Assigned**: Via automated script  
**Status**: Active  

---

## Next Steps

1. ✅ Log out and log back in as josh@lemonade.art
2. ✅ Verify admin badge appears on dashboard
3. ✅ Access /admin/users to manage users
4. ✅ Create a test user with USER role
5. ✅ Use admin UI to promote test user to MODERATOR
6. Test role-based features

---

## Troubleshooting

### "Role not appearing"
- Log out and log back in (roles loaded on login)
- Check role in LogTo console
- Verify M2M app has Management API permissions

### "Cannot access admin panel"
- Ensure you're logged in as josh@lemonade.art
- Check session.user.role in console
- Verify role setup script ran successfully

### "Role change not working"
- Check M2M credentials in docker-compose.override.yml
- View app logs: `docker-compose logs app`
- Verify LogTo Management API is accessible

---

**Implementation Status**: ✅ Complete  
**LogTo Integration**: ✅ Management API  
**Role Assignment**: ✅ Automated  
**Admin UI**: ✅ Functional  
**Testing**: ⏳ Ready for testing  

