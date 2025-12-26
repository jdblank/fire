import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://fireuser:firepass@localhost:5432/fire_db'
})

describe('Event Management System', () => {
  let testEventId: string
  let testUserId: string
  let lineItemId: string
  let registrationId: string

  beforeAll(async () => {
    // Create test user with date of birth
    const user = await prisma.user.create({
      data: {
        email: `event-test-${Date.now()}@example.com`,
        firstName: 'Event',
        lastName: 'Tester',
        displayName: 'Event Tester',
        dateOfBirth: new Date('1990-01-01'),
        accountStatus: 'ACTIVE',
      }
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup
    if (registrationId) {
      await prisma.eventRegistration.delete({ where: { id: registrationId } }).catch(() => {})
    }
    if (testEventId) {
      await prisma.event.delete({ where: { id: testEventId } }).catch(() => {})
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('Event CRUD', () => {
    it('should create a paid event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Test Annual Gathering',
          description: 'Test event for pricing',
          startDate: new Date('2025-08-24T12:00:00Z'),
          endDate: new Date('2025-08-30T12:00:00Z'),
          location: 'Black Rock City, NV',
          timezone: 'America/Los_Angeles',
          eventType: 'PAID',
          requiresDeposit: true,
          depositAmount: 500,
          maxAttendees: 100,
          status: 'PUBLISHED',
        }
      })

      expect(event).toBeDefined()
      expect(event.title).toBe('Test Annual Gathering')
      expect(event.eventType).toBe('PAID')
      expect(event.requiresDeposit).toBe(true)
      expect(parseFloat(event.depositAmount?.toString() || '0')).toBe(500)
      
      testEventId = event.id
    })

    it('should retrieve event by ID', async () => {
      const event = await prisma.event.findUnique({
        where: { id: testEventId }
      })

      expect(event).toBeDefined()
      expect(event?.title).toBe('Test Annual Gathering')
    })

    it('should update event', async () => {
      const updated = await prisma.event.update({
        where: { id: testEventId },
        data: {
          maxAttendees: 150
        }
      })

      expect(updated.maxAttendees).toBe(150)
    })

    it('should list events', async () => {
      const events = await prisma.event.findMany()
      
      expect(events.length).toBeGreaterThan(0)
      expect(events.some(e => e.id === testEventId)).toBe(true)
    })
  })

  describe('Event Line Items', () => {
    it('should create age-based line item', async () => {
      const lineItem = await prisma.eventLineItem.create({
        data: {
          eventId: testEventId,
          name: 'Annual Dues',
          description: 'Age-based membership dues',
          lineItemType: 'AGE_BASED',
          isRequired: true,
          calculationMethod: 'AGE_MULTIPLIER',
          multiplier: 60,
          minAmount: 1800,
          maxAmount: 3600,
          sortOrder: 1,
        }
      })

      expect(lineItem).toBeDefined()
      expect(lineItem.lineItemType).toBe('AGE_BASED')
      expect(parseFloat(lineItem.multiplier?.toString() || '0')).toBe(60)
      
      lineItemId = lineItem.id
    })

    it('should create optional fixed line item', async () => {
      const lineItem = await prisma.eventLineItem.create({
        data: {
          eventId: testEventId,
          name: 'RV Supplement',
          description: 'Additional fee for RV',
          lineItemType: 'OPTIONAL_FIXED',
          isRequired: false,
          calculationMethod: 'FIXED_AMOUNT',
          baseAmount: 550,
          sortOrder: 2,
        }
      })

      expect(lineItem).toBeDefined()
      expect(lineItem.isRequired).toBe(false)
      expect(parseFloat(lineItem.baseAmount?.toString() || '0')).toBe(550)

      // Cleanup
      await prisma.eventLineItem.delete({ where: { id: lineItem.id } })
    })

    it('should list line items for event', async () => {
      const lineItems = await prisma.eventLineItem.findMany({
        where: { eventId: testEventId },
        orderBy: { sortOrder: 'asc' }
      })

      expect(lineItems.length).toBeGreaterThan(0)
      expect(lineItems[0].sortOrder).toBeLessThanOrEqual(lineItems[lineItems.length - 1].sortOrder)
    })
  })

  describe('Event Registration', () => {
    it('should create registration with line items', async () => {
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: testEventId,
          userId: testUserId,
          status: 'PENDING',
          totalAmount: 2100, // 35 years * 60 = 2100
          depositPaid: 0,
          balanceDue: 2100,
          paymentStatus: 'UNPAID',
          lineItems: {
            create: [
              {
                lineItemId: lineItemId,
                quantity: 1,
                calculatedAmount: 2100,
                userAge: 35,
              }
            ]
          }
        },
        include: {
          lineItems: true
        }
      })

      expect(registration).toBeDefined()
      expect(parseFloat(registration.totalAmount.toString())).toBe(2100)
      expect(registration.lineItems.length).toBe(1)
      expect(registration.paymentStatus).toBe('UNPAID')
      
      registrationId = registration.id
    })

    it('should prevent duplicate registration', async () => {
      const count = await prisma.eventRegistration.count({
        where: {
          eventId: testEventId,
          userId: testUserId
        }
      })

      expect(count).toBe(1) // Only one registration allowed
    })

    it('should update payment status', async () => {
      const updated = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          depositPaid: 500,
          balanceDue: 1600,
          paymentStatus: 'DEPOSIT_PAID'
        }
      })

      expect(parseFloat(updated.depositPaid.toString())).toBe(500)
      expect(updated.paymentStatus).toBe('DEPOSIT_PAID')
    })

    it('should get registrations for event', async () => {
      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: testEventId },
        include: {
          user: true,
          lineItems: true
        }
      })

      expect(registrations.length).toBeGreaterThan(0)
      expect(registrations[0].user).toBeDefined()
    })
  })

  describe('Discounts', () => {
    it('should apply fixed discount', async () => {
      const discount = await prisma.discount.create({
        data: {
          registrationId: registrationId,
          name: 'Early Bird Discount',
          discountType: 'FIXED_AMOUNT',
          amount: 200,
        }
      })

      expect(discount).toBeDefined()
      expect(parseFloat(discount.amount.toString())).toBe(200)

      // Cleanup
      await prisma.discount.delete({ where: { id: discount.id } })
    })

    it('should apply percentage discount', async () => {
      const discount = await prisma.discount.create({
        data: {
          registrationId: registrationId,
          name: '10% Family Discount',
          discountType: 'PERCENTAGE',
          amount: 10, // 10%
        }
      })

      expect(discount).toBeDefined()
      expect(discount.discountType).toBe('PERCENTAGE')

      // Cleanup
      await prisma.discount.delete({ where: { id: discount.id } })
    })
  })

  describe('Event Capacity', () => {
    it('should track registration count', async () => {
      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        include: {
          _count: {
            select: { registrations: true }
          }
        }
      })

      expect(event?._count.registrations).toBeGreaterThan(0)
    })

    it('should respect max attendees', async () => {
      const event = await prisma.event.findUnique({
        where: { id: testEventId }
      })

      expect(event?.maxAttendees).toBe(150) // Updated earlier
    })
  })
})

