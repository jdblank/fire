import { z } from 'zod'

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  images: z.array(z.string().url()).max(4).optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export type CreatePost = z.infer<typeof createPostSchema>
export type CreateComment = z.infer<typeof createCommentSchema>
