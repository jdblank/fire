import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  banner: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  isFree: z.boolean().default(true),
  price: z.number().positive().optional(),
  currency: z.string().default('USD'),
  maxAttendees: z.number().positive().optional(),
})

export type CreateEvent = z.infer<typeof createEventSchema>
















