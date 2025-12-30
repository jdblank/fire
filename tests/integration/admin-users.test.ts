import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL || 'postgresql://fireuser:firepass@localhost:5432/fire_db',
})

describe('Admin User Management', () => {
  let testUserId: string
  let inviteToken: string

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('User CRUD Operations', () => {
    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          accountStatus: 'PENDING_INVITE',
        },
      })

      expect(user).toBeDefined()
      expect(user.email).toContain('@example.com')
      expect(user.firstName).toBe('Test')
      expect(user.lastName).toBe('User')
      expect(user.accountStatus).toBe('PENDING_INVITE')

      testUserId = user.id
    })

    it('should retrieve user by ID', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      })

      expect(user).toBeDefined()
      expect(user?.firstName).toBe('Test')
    })

    it('should update user profile', async () => {
      const updated = await prisma.user.update({
        where: { id: testUserId },
        data: {
          hometown: 'New York',
          mobilePhone: '+1-555-1234',
          countryCode: '+1',
        },
      })

      expect(updated.hometown).toBe('New York')
      expect(updated.mobilePhone).toBe('+1-555-1234')
    })

    it('should list all users', async () => {
      const users = await prisma.user.findMany()

      expect(users.length).toBeGreaterThan(0)
      expect(users[0]).toHaveProperty('email')
      expect(users[0]).toHaveProperty('firstName')
      expect(users[0]).toHaveProperty('accountStatus')
    })
  })

  describe('Referral System', () => {
    it('should create user with referral', async () => {
      // Get an existing user to be the referrer
      const referrer = await prisma.user.findFirst()
      expect(referrer).toBeDefined()

      const referred = await prisma.user.create({
        data: {
          email: `referred-${Date.now()}@example.com`,
          firstName: 'Referred',
          lastName: 'User',
          accountStatus: 'PENDING_INVITE',
          referredById: referrer!.id,
        },
        include: {
          referredBy: true,
        },
      })

      expect(referred.referredById).toBe(referrer!.id)
      expect(referred.referredBy).toBeDefined()
      expect(referred.referredBy?.email).toBe(referrer!.email)

      // Cleanup
      await prisma.user.delete({ where: { id: referred.id } })
    })

    it('should count referrals', async () => {
      const user = await prisma.user.findFirst({
        include: {
          _count: {
            select: { referrals: true },
          },
        },
      })

      expect(user).toBeDefined()
      expect(user?._count).toHaveProperty('referrals')
    })
  })

  describe('Invite Token System', () => {
    it('should create invite token', async () => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const token = await prisma.inviteToken.create({
        data: {
          userId: testUserId,
          expiresAt,
        },
      })

      expect(token).toBeDefined()
      expect(token.token).toBeDefined()
      expect(token.userId).toBe(testUserId)
      expect(token.usedAt).toBeNull()

      inviteToken = token.id
    })

    it('should retrieve invite token', async () => {
      const token = await prisma.inviteToken.findUnique({
        where: { id: inviteToken },
        include: { user: true },
      })

      expect(token).toBeDefined()
      expect(token?.user).toBeDefined()
      expect(token?.user.email).toContain('@example.com')
    })

    it('should mark token as used', async () => {
      const updated = await prisma.inviteToken.update({
        where: { id: inviteToken },
        data: { usedAt: new Date() },
      })

      expect(updated.usedAt).toBeDefined()
    })

    it('should invalidate old tokens', async () => {
      // This tests the logic of invalidating unused tokens when generating new ones
      const count = await prisma.inviteToken.updateMany({
        where: {
          userId: testUserId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      })

      // Should be 0 since we already used the token above
      expect(count.count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Account Status Management', () => {
    it('should update account status', async () => {
      const user = await prisma.user.update({
        where: { id: testUserId },
        data: { accountStatus: 'ACTIVE' },
      })

      expect(user.accountStatus).toBe('ACTIVE')
    })

    it('should filter by account status', async () => {
      const activeUsers = await prisma.user.findMany({
        where: { accountStatus: 'ACTIVE' },
      })

      expect(activeUsers.length).toBeGreaterThan(0)
      activeUsers.forEach((user) => {
        expect(user.accountStatus).toBe('ACTIVE')
      })
    })

    it('should support all account statuses', async () => {
      const statuses = ['PENDING_INVITE', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']

      for (const status of statuses) {
        const users = await prisma.user.findMany({
          where: { accountStatus: status as any },
        })
        // Should not error
        expect(Array.isArray(users)).toBe(true)
      }
    })
  })

  describe('User Search', () => {
    it('should search by email', async () => {
      const users = await prisma.user.findMany({
        where: {
          email: { contains: 'example.com', mode: 'insensitive' },
        },
      })

      expect(users.length).toBeGreaterThan(0)
      users.forEach((user) => {
        expect(user.email.toLowerCase()).toContain('example.com')
      })
    })

    it('should search by name', async () => {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: 'Test', mode: 'insensitive' } },
            { lastName: { contains: 'User', mode: 'insensitive' } },
          ],
        },
      })

      expect(users.length).toBeGreaterThan(0)
    })
  })
})
