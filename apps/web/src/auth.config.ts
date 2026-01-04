// LogTo configuration from environment
const LOGTO_ISSUER = process.env.LOGTO_ISSUER || 'http://localhost:3001/oidc'
const LOGTO_APP_ID = process.env.LOGTO_APP_ID
const LOGTO_APP_SECRET = process.env.LOGTO_APP_SECRET
const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
// Browser endpoint should use NEXT_PUBLIC var for client-side, or derive from LOGTO_ENDPOINT
const BROWSER_ENDPOINT =
  process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || process.env.LOGTO_ENDPOINT || 'http://localhost:3001'

function LogtoProvider(options: any = {}): any {
  return {
    id: options.id || 'logto',
    name: options.name || 'Fire',
    type: 'oidc',
    // Specify issuer for validation
    issuer: LOGTO_ISSUER,
    clientId: LOGTO_APP_ID,
    clientSecret: LOGTO_APP_SECRET,
    checks: ['pkce', 'state'],
    // LogTo uses ES384 for JWT signing
    idToken: true,
    client: {
      id_token_signed_response_alg: 'ES384',
    },
    // Manually specify endpoints to handle Docker networking
    // Browser uses localhost, server uses docker service name
    authorization: {
      url: `${BROWSER_ENDPOINT}/oidc/auth`,
      params: {
        scope: 'openid profile email roles',
        ...(options.authParams || {}),
      },
    },
    token: `${LOGTO_ENDPOINT}/oidc/token`,
    userinfo: `${LOGTO_ENDPOINT}/oidc/me`,
    profile(profile: any) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.name || profile.username,
        image: profile.picture,
        roles: profile.roles || [],
      }
    },
  }
}

export const authConfig = {
  providers: [
    LogtoProvider(),
    LogtoProvider({
      id: 'logto-signup',
      name: 'Fire Register',
      authParams: {
        interaction_mode: 'signUp',
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Edge-compatible callbacks (no database operations)
    // These run in both Edge and Node.js runtimes
    async jwt({ token, user, account }: any) {
      // Add user info to token on initial sign in
      if (user) {
        token.id = user.id
        token.roles = user.roles
      }
      // Add id_token from OAuth provider
      if (account?.id_token) {
        token.id_token = account.id_token
      }
      return token
    },
    async session({ session, token }: any) {
      // Pass token info to session
      if (token) {
        session.user.id = token.id as string
        session.user.roles = token.roles
        session.user.image = token.image as string | null
        session.id_token = token.id_token as string
      }
      return session
    },
    async authorized({ auth, request }: any) {
      const { pathname } = request.nextUrl

      // Public routes that don't require authentication
      const publicRoutes = ['/', '/login', '/register', '/forgot-password']

      // Check if the current path is public
      const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
      )

      // Allow public routes without authentication
      if (isPublicRoute) {
        return true
      }

      // For all other routes, require authentication
      return !!auth?.user
    },
  },
}
