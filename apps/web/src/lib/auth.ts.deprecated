import { AuthOptions } from 'next-auth'
import { OAuthConfig } from 'next-auth/providers'
import { PrismaClient } from '@prisma/client'
import { UserRole } from '@fire/types'

const prisma = new PrismaClient()

// Get LogTo configuration from environment variables
// In production, these MUST be set - no fallback to dev URLs
const NODE_ENV = process.env.NODE_ENV || 'development'
// Check if we're in production by checking NODE_ENV OR if we're on Vercel (VERCEL env var)
const isProduction = NODE_ENV === 'production' || !!process.env.VERCEL
const isDevelopment = !isProduction

// ALWAYS log environment in production/Vercel to help diagnose issues
if (isProduction) {
  console.log('[AUTH] Environment check:', {
    NODE_ENV,
    VERCEL: process.env.VERCEL || 'NOT SET',
    isProduction,
    LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT ? `SET (${process.env.LOGTO_ENDPOINT})` : 'MISSING',
    LOGTO_ISSUER: process.env.LOGTO_ISSUER ? `SET (${process.env.LOGTO_ISSUER})` : 'MISSING',
    LOGTO_APP_ID: process.env.LOGTO_APP_ID ? 'SET' : 'MISSING',
    LOGTO_APP_SECRET: process.env.LOGTO_APP_SECRET ? 'SET' : 'MISSING',
  })
}

// NEVER use dev fallback in production/Vercel
const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || (isDevelopment ? 'http://localhost:3001' : undefined)
const LOGTO_ISSUER = process.env.LOGTO_ISSUER || (LOGTO_ENDPOINT ? `${LOGTO_ENDPOINT}/oidc` : undefined)
const LOGTO_APP_ID = process.env.LOGTO_APP_ID
const LOGTO_APP_SECRET = process.env.LOGTO_APP_SECRET

// Validate required environment variables
// In production/Vercel, fail fast with clear error messages
if (!LOGTO_ENDPOINT) {
  const error = new Error(
    `LOGTO_ENDPOINT environment variable is required in production. ` +
    `NODE_ENV: ${NODE_ENV}, ` +
    `VERCEL: ${process.env.VERCEL || 'NOT SET'}, ` +
    `isProduction: ${isProduction}, ` +
    `LOGTO_ENDPOINT: ${process.env.LOGTO_ENDPOINT || 'undefined'}`
  )
  console.error('[AUTH] Configuration Error:', error.message)
  console.error('[AUTH] All env vars:', Object.keys(process.env).filter(k => k.includes('LOGTO') || k === 'NODE_ENV' || k === 'VERCEL').map(k => `${k}=${process.env[k] ? 'SET' : 'NOT SET'}`))
  throw error
}
if (!LOGTO_ISSUER) {
  const error = new Error(
    `LOGTO_ISSUER environment variable is required. ` +
    `LOGTO_ENDPOINT: ${LOGTO_ENDPOINT}, ` +
    `LOGTO_ISSUER: ${process.env.LOGTO_ISSUER || 'undefined'}`
  )
  console.error('[AUTH] Configuration Error:', error.message)
  throw error
}
if (!LOGTO_APP_ID && isProduction) {
  const error = new Error('LOGTO_APP_ID environment variable is required in production')
  console.error('[AUTH] Configuration Error:', error.message)
  throw error
}
if (!LOGTO_APP_SECRET && isProduction) {
  const error = new Error('LOGTO_APP_SECRET environment variable is required in production')
  console.error('[AUTH] Configuration Error:', error.message)
  throw error
}

// Log successful configuration (only in production)
if (isProduction) {
  console.log('[AUTH] Configuration loaded successfully:', {
    LOGTO_ENDPOINT,
    LOGTO_ISSUER,
    hasAppId: !!LOGTO_APP_ID,
    hasAppSecret: !!LOGTO_APP_SECRET,
    NODE_ENV,
    VERCEL: process.env.VERCEL || 'NOT SET',
  })
}

// LogTo OAuth Provider
function LogtoProvider(options: Partial<OAuthConfig<any>> = {}): OAuthConfig<any> {
  const defaultAuthorization = {
    url: `${LOGTO_ISSUER}/auth`, // Public URL for browser
    params: {
      scope: 'openid profile email',
    },
  }

  return {
    id: 'logto',
    name: 'Fire',
    type: 'oauth',
    issuer: LOGTO_ISSUER,
    // Manually configure endpoints to handle split-horizon DNS (Docker internal vs Browser external)
    // Browser needs localhost, Backend needs logto:3001
    token: `${LOGTO_ENDPOINT}/oidc/token`, // Internal URL for backend
    userinfo: `${LOGTO_ENDPOINT}/oidc/me`, // Internal URL for backend
    jwks_endpoint: `${LOGTO_ENDPOINT}/oidc/jwks`, // Internal URL for backend
    // Remove wellKnown to prevent overwriting these with bad discovery data
    clientId: LOGTO_APP_ID,
    clientSecret: LOGTO_APP_SECRET,
    checks: ['pkce', 'state'],
    client: {
      token_endpoint_auth_method: 'client_secret_post',
      id_token_signed_response_alg: 'ES384',
    },
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.name || profile.username,
        image: profile.picture,
        username: profile.username,
      }
    },
    ...options,
    authorization: {
      ...defaultAuthorization,
      ...(options.authorization || {}),
      params: {
        ...defaultAuthorization.params,
        ...(options.authorization?.params || {}),
      }
    },
  }
}

export const authOptions: AuthOptions = {
  providers: [
    LogtoProvider(),
    LogtoProvider({
      id: 'logto-signup',
      name: 'Fire Register',
      authorization: {
        url: `${LOGTO_ISSUER}/auth`,
        params: {
          scope: 'openid profile email',
          // prompt: 'create' caused error, trying LogTo specific param
          interaction_mode: 'signUp'
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      console.log('[SIGNIN] Starting signIn callback', { userId: user?.id, email: user?.email })
      
      if (!user?.email) {
        console.error('[SIGNIN] No email in user object', { user })
        return false
      }

      try {
        // Check if user already exists in database - use existing role if available
        const existingDbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true }
        })
        
        let userRole: UserRole = (existingDbUser?.role || UserRole.USER) as UserRole
        console.log('[SIGNIN] User role from database', { email: user.email, role: userRole })
        
        // Only try to fetch from LogTo if user doesn't exist yet (first sign in)
        if (!existingDbUser) {
          console.log('[SIGNIN] New user - fetching role from LogTo', { userId: user.id })
      try {
        const { getUserFromLogTo } = await import('./logto-experience')
        const logtoUser = await getUserFromLogTo(user.id)
        const roles = logtoUser.roles
        
        // Ensure roles is an array
        const rolesArray = Array.isArray(roles) ? roles : []
        console.log('[SIGNIN] Got roles from LogTo', { 
          rolesType: typeof roles,
          isArray: Array.isArray(roles),
          roles: rolesArray.map((r: { name: string }) => r.name) 
        })

            // Map LogTo role name to our enum
            if (rolesArray.some((r: { name: string }) => r.name === 'admin')) {
              userRole = UserRole.ADMIN
            } else if (rolesArray.some((r: { name: string }) => r.name === 'moderator')) {
              userRole = UserRole.MODERATOR
            } else {
              userRole = UserRole.USER
            }
      } catch (roleError) {
            console.warn('[SIGNIN] Failed to fetch roles from LogTo, using default USER role', roleError)
            // Continue with default USER role for new users
          }
        }

        // Parse name
        const nameParts = (user.name || user.username || user.email.split('@')[0]).split(' ')
        const firstName = nameParts[0] || 'User'
        const lastName = nameParts.slice(1).join(' ') || ''

        // Check if user exists to preserve local data
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { image: true }
        })

        // Sync user to our database
        console.log('[SIGNIN] Syncing user to database', { email: user.email, role: userRole })
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            logtoId: user.id,
            firstName,
            lastName: lastName || firstName,
            displayName: user.name || user.username,
            username: user.username,
            // Only update image if LogTo has one OR if we don't have a local image
            ...(user.image || !existingUser?.image ? { image: user.image } : {}),
            role: userRole,
            accountStatus: 'ACTIVE',
            lastLoginAt: new Date(),
          },
          create: {
            id: user.id,
            logtoId: user.id,
            email: user.email,
            firstName,
            lastName: lastName || firstName,
            displayName: user.name || user.username,
            username: user.username,
            image: user.image,
            role: userRole,
            accountStatus: 'ACTIVE',
          },
        })

        // Store role in user object for JWT callback
        user.role = userRole

        console.log('[SIGNIN] Sign in successful', { userId: user.id, email: user.email, role: userRole })
        return true
      } catch (error) {
        console.error('[SIGNIN] Sign in error:', error)
        console.error('[SIGNIN] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        return false
      }
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = user.role
      }
      // Store id_token for proper OIDC logout
      if (account?.id_token) {
        token.id_token = account.id_token
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as UserRole
        
        // Store id_token for logout
        if (token.id_token) {
          (session as any).id_token = token.id_token as string
        }
        
        // Fetch fresh image from database to reflect uploads
        const user = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { image: true }
        })
        session.user.image = user?.image || token.picture as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
}
