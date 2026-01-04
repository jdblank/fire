import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

describe('User Schema - Role Field Removal', () => {
  let prisma: PrismaClient
  let testUserId: string

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
    // Clean up test user
    if (testUserId) {
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'test-role-migration' } },
      })
    }
    await prisma.$disconnect()
  })

  describe('Database Schema Validation', () => {
    it('should not have role column in users table', async () => {
      // Query the database schema
      const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND table_schema = 'public'
      `

      const columnNames = columns.map((c) => c.column_name)
      expect(columnNames).not.toContain('role')
    })

    it('should not have UserRole enum type in database', async () => {
      // Check if UserRole enum type exists
      const enumTypes = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname
        FROM pg_type
        WHERE typtype = 'e' AND typname = 'UserRole'
      `

      expect(enumTypes.length).toBe(0)
    })

    it('should not have role index', async () => {
      // Check for role index
      const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'users'
          AND schemaname = 'public'
      `

      const indexNames = indexes.map((i) => i.indexname)
      expect(indexNames.filter((name) => name.includes('role'))).toEqual([])
    })
  })

  describe('User CRUD Operations Without Role', () => {
    it('should create user without role field', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-role-migration-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          accountStatus: 'PENDING_INVITE',
        },
      })

      testUserId = user.id
      expect(user.id).toBeDefined()
      expect(user.email).toContain('test-role-migration')
      // @ts-expect-error - role should not exist
      expect(user.role).toBeUndefined()
    })

    it('should query user without role field in response', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-role-migration-query-${Date.now()}@example.com`,
          firstName: 'Query',
          lastName: 'Test',
          accountStatus: 'ACTIVE',
        },
      })

      const queriedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(queriedUser).toBeDefined()
      // @ts-expect-error - role should not exist
      expect(queriedUser?.role).toBeUndefined()

      // Verify the keys don't include 'role'
      if (queriedUser) {
        const userKeys = Object.keys(queriedUser)
        expect(userKeys).not.toContain('role')
      }

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should update user without role field', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-role-migration-update-${Date.now()}@example.com`,
          firstName: 'Update',
          lastName: 'Test',
          accountStatus: 'PENDING_INVITE',
        },
      })

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: 'Updated',
          accountStatus: 'ACTIVE',
        },
      })

      expect(updatedUser.firstName).toBe('Updated')
      expect(updatedUser.accountStatus).toBe('ACTIVE')
      // @ts-expect-error - role should not exist
      expect(updatedUser.role).toBeUndefined()

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should not accept role in create data', async () => {
      // This test verifies TypeScript will catch attempts to use role
      // @ts-expect-error - role should not be a valid field
      const attemptCreate = () =>
        prisma.user.create({
          data: {
            email: `test-invalid-${Date.now()}@example.com`,
            firstName: 'Test',
            lastName: 'User',
            accountStatus: 'PENDING_INVITE',
            role: 'ADMIN', // This should be a TypeScript error
          },
        })

      // The TypeScript error above is the main assertion
      // If this compiles, the test should fail
      expect(attemptCreate).toBeDefined()
    })
  })

  describe('Existing Users Migration', () => {
    it('should have no users with role data', async () => {
      // Raw query to check if any role data exists
      const usersWithRole = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "users"
        WHERE EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users'
            AND column_name = 'role'
        )
      `

      // If role column doesn't exist, this query should work and return 0
      // If role column exists, it means migration didn't run
      expect(Number(usersWithRole[0]?.count || 0)).toBe(0)
    })

    it('should be able to fetch all users without errors', async () => {
      // This verifies that existing users in the database work fine
      // without the role field
      const users = await prisma.user.findMany({
        take: 10,
      })

      expect(Array.isArray(users)).toBe(true)

      // Verify none have role property
      users.forEach((user) => {
        // @ts-expect-error - role should not exist
        expect(user.role).toBeUndefined()
      })
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should not have role in User type', () => {
      // This is primarily a compile-time check
      // If role exists in the User type, this won't compile

      type UserKeys = keyof Awaited<ReturnType<typeof prisma.user.findFirst>>
      const userKeys: UserKeys[] = []

      // @ts-expect-error - 'role' should not be assignable to UserKeys
      const invalidKey: UserKeys = 'role'

      expect(invalidKey).toBe('role')
    })
  })
})
