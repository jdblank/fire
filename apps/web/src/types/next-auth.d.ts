import 'next-auth'
import { UserRole } from '@fire/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      roles: string[]
    }
    accessToken?: string
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    roles: string[]
  }

  interface JWT {
    accessToken?: string
    idToken?: string
    role?: UserRole
    roles?: string[]
  }
}
