import { UserRole } from "@fire/types"

// LogTo configuration from environment
const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || "http://logto:3001"
const LOGTO_ISSUER = process.env.LOGTO_ISSUER || "http://localhost:3001/oidc"
const LOGTO_APP_ID = process.env.LOGTO_APP_ID
const LOGTO_APP_SECRET = process.env.LOGTO_APP_SECRET

function LogtoProvider(options: any = {}): any {
  const defaultAuthorization = {
    url: `${LOGTO_ISSUER}/auth`,
    params: { scope: "openid profile email" },
  }

  return {
    id: "logto",
    name: "Fire",
    type: "oidc",
    issuer: LOGTO_ISSUER,
    token: `${LOGTO_ENDPOINT}/oidc/token`,
    userinfo: `${LOGTO_ENDPOINT}/oidc/me`,
    jwks_endpoint: `${LOGTO_ENDPOINT}/oidc/jwks`,
    clientId: LOGTO_APP_ID,
    clientSecret: LOGTO_APP_SECRET,
    checks: ["pkce", "state"],
    profile(profile: any) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.name || profile.username,
        image: profile.picture,
        role: (profile.role as UserRole) || UserRole.USER,
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

export const authConfig = {
  providers: [
    LogtoProvider(),
    LogtoProvider({
      id: "logto-signup",
      name: "Fire Register",
      authorization: {
        url: `${LOGTO_ISSUER}/auth`,
        params: {
          scope: "openid profile email",
          interaction_mode: "signUp"
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Edge-compatible callbacks (no database operations)
    // These run in both Edge and Node.js runtimes
    async jwt({ token, user, account }: any) {
      // Add user info to token on initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
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
        session.user.role = token.role
        session.id_token = token.id_token as string
      }
      return session
    },
    async authorized({ auth, request }: any) {
      const { pathname } = request.nextUrl
      
      // Public routes that don't require authentication
      const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
      ]
      
      // Check if the current path is public
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
      
      // Allow public routes without authentication
      if (isPublicRoute) {
        return true
      }
      
      // For all other routes, require authentication
      return !!auth?.user
    },
  },
}
