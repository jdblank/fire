import NextAuth, { type DefaultSession } from 'next-auth'
import { PrismaClient } from '@fire/db'
import { UserRole } from '@fire/types'
import { authConfig } from './auth.config'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
    id_token?: string
  }

  interface User {
    role: UserRole
  }
}

// Augment the JWT interface directly
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    id_token?: string
  }
}

const prisma = new PrismaClient()

// NextAuth v5 initialization for Next.js 16 with Split Config
// Using manual database sync instead of PrismaAdapter to work with custom schema
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Override callbacks from authConfig with Node.js-specific ones that can access the database
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }: any) {
      // On initial sign in, add user info from the provider
      if (user) {
        // Sync user to database on initial sign-in
        if (user.email) {
          try {
            const existingDbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, role: true },
            })

            let userRole: UserRole = (existingDbUser?.role || UserRole.USER) as UserRole

            // Fetch role from LogTo for new users
            if (!existingDbUser && user.id) {
              try {
                const { getUserFromLogTo } = await import('@/lib/logto-experience')
                const logtoUser = await getUserFromLogTo(user.id)
                const roles = logtoUser.roles
                const rolesArray = Array.isArray(roles) ? roles : []

                if (rolesArray.some((r: any) => r.name === 'admin')) {
                  userRole = UserRole.ADMIN
                } else if (rolesArray.some((r: any) => r.name === 'moderator')) {
                  userRole = UserRole.MODERATOR
                }
              } catch (e) {
                console.warn('[AUTH] Failed to fetch roles from LogTo', e)
              }
            }

            const nameParts = (user.name || user.email.split('@')[0]).split(' ')
            const firstName = nameParts[0] || 'User'
            const lastName = nameParts.slice(1).join(' ') || ''

            // Sync user to database
            const syncedUser = await prisma.user.upsert({
              where: { email: user.email },
              update: {
                logtoId: user.id,
                firstName,
                lastName: lastName || firstName,
                displayName: user.name,
                role: userRole,
                accountStatus: 'ACTIVE',
                lastLoginAt: new Date(),
              },
              create: {
                id: user.id!,
                logtoId: user.id,
                email: user.email,
                firstName,
                lastName: lastName || firstName,
                displayName: user.name,
                role: userRole,
                accountStatus: 'ACTIVE',
              },
              select: { id: true },
            })

            // Use the database user ID (not the LogTo ID) for session
            token.id = syncedUser.id
            token.role = userRole
            console.log(
              `[AUTH JWT] User synced to database: ${user.email} -> DB ID: ${syncedUser.id}, role: ${userRole}`
            )
          } catch (error) {
            console.error('[AUTH JWT] Database sync error:', error)
            token.role = user?.role || 'USER'
          }
        }
      }

      // Add id_token from OAuth provider
      if (account?.id_token) {
        token.id_token = account.id_token
      }

      // On subsequent requests, fetch the role from database
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true },
          })

          if (dbUser) {
            token.id = dbUser.id // Ensure we always use the database ID
            token.role = dbUser.role
            console.log(`[AUTH JWT] Refreshed role from database: ${token.id} -> ${dbUser.role}`)
          }
        } catch (error) {
          console.error('[AUTH JWT] Failed to fetch user role from database:', error)
        }
      }

      return token
    },
  },
  // Use events instead of callbacks for database operations
  // Events run only in Node.js runtime, not in Edge middleware
  events: {
    async signIn({ user }: any) {
      if (!user?.email) return

      try {
        const existingDbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        })

        let userRole: UserRole = (existingDbUser?.role || UserRole.USER) as UserRole

        // Fetch role from LogTo for new users
        if (!existingDbUser && user.id) {
          try {
            const { getUserFromLogTo } = await import('@/lib/logto-experience')
            const logtoUser = await getUserFromLogTo(user.id)
            const roles = logtoUser.roles
            const rolesArray = Array.isArray(roles) ? roles : []

            if (rolesArray.some((r: any) => r.name === 'admin')) {
              userRole = UserRole.ADMIN
            } else if (rolesArray.some((r: any) => r.name === 'moderator')) {
              userRole = UserRole.MODERATOR
            }
          } catch (e) {
            console.warn('[AUTH] Failed to fetch roles from LogTo', e)
          }
        }

        const nameParts = (user.name || user.email.split('@')[0]).split(' ')
        const firstName = nameParts[0] || 'User'
        const lastName = nameParts.slice(1).join(' ') || ''

        // Sync user to database
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            logtoId: user.id,
            firstName,
            lastName: lastName || firstName,
            displayName: user.name,
            role: userRole,
            accountStatus: 'ACTIVE',
            lastLoginAt: new Date(),
          },
          create: {
            id: user.id!,
            logtoId: user.id,
            email: user.email,
            firstName,
            lastName: lastName || firstName,
            displayName: user.name,
            role: userRole,
            accountStatus: 'ACTIVE',
          },
        })

        console.log(`[AUTH] User synced to database: ${user.email} (${userRole})`)
      } catch (error) {
        console.error('[AUTH] Database sync error:', error)
        // Don't throw - allow sign in to proceed even if DB sync fails
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})
