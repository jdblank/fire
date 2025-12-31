import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  banner: z.string().url().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  isAllDay: z.boolean().default(false).optional(),
  isFree: z.boolean().default(true),
  price: z.number().positive().optional(),
  currency: z.string().default('USD'),
  maxAttendees: z.number().positive().optional(),
})

export type CreateEvent = z.infer<typeof createEventSchema>

export const csvEventImportSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
})

export type CsvEventImport = z.infer<typeof csvEventImportSchema>
