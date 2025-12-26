import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Log configuration on server startup (always log in production to help diagnose)
const NODE_ENV = process.env.NODE_ENV || 'development'
if (NODE_ENV === 'production' || process.env.DEBUG_AUTH === 'true') {
  console.log('[NextAuth] Configuration loaded:', {
    NODE_ENV,
    hasProviders: !!authOptions.providers?.length,
    providerIds: authOptions.providers?.map(p => p.id),
    hasSecret: !!authOptions.secret,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    logtoEndpoint: process.env.LOGTO_ENDPOINT || 'NOT SET',
  })
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }















