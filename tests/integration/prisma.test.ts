import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

describe('Prisma Database Integration', () => {
  let prisma: PrismaClient

  // Detect if we're running inside Docker
  const isInDocker = process.env.DATABASE_URL?.includes('postgres:5432')
  const POSTGRES_HOST = isInDocker ? 'postgres' : 'localhost'
  const DATABASE_URL =
    process.env.DATABASE_URL || `postgres://fireuser:firepass@${POSTGRES_HOST}:5432/fire_db`

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    })
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Database Connection', () => {
    it('should connect to database', async () => {
      await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined()
    })

    it('should execute raw queries', async () => {
      const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`
      expect(result[0].result).toBe(1)
    })
  })

  describe('Schema Validation', () => {
    it('should have users table', async () => {
      const count = await prisma.user.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should have events table', async () => {
      const count = await prisma.event.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should have posts table', async () => {
      const count = await prisma.post.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CRUD Operations', () => {
    it('should create and read a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
        },
      })

      expect(user).toHaveProperty('id')
      expect(user.email).toContain('test-')
      expect(user.firstName).toBe('Test')
      expect(user.lastName).toBe('User')

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should create and read an event', async () => {
      const event = await prisma.event.create({
        data: {
          title: `Test Event ${Date.now()}`,
          description: 'Test event description',
          startDate: new Date(),
          endDate: new Date(Date.now() + 3600000), // 1 hour later
          location: 'Test Location',
        },
      })

      expect(event).toHaveProperty('id')
      expect(event.title).toContain('Test Event')

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } })
    })
  })
})
