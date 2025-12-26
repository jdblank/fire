import { z } from 'zod'

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string
  email: string
  emailVerified?: Date | null
  name?: string | null
  username?: string | null
  image?: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export const userProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
})

export type UserProfile = z.infer<typeof userProfileSchema>




