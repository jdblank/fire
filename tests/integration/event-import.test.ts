import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { parseEventImportRow } from '../../apps/web/src/lib/import-utils'

const prisma = new PrismaClient()

describe('Bulk Event Import API Logic', () => {
  let testUserId: string
  const createdEventIds: string[] = []

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `import-test-${Date.now()}@example.com`,
        firstName: 'Import',
        lastName: 'Tester',
        displayName: 'Import Tester',
        accountStatus: 'ACTIVE',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    if (createdEventIds.length > 0) {
      await prisma.event.deleteMany({
        where: { id: { in: createdEventIds } },
      })
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } })
    }
    await prisma.$disconnect()
  })

  it('should correctly parse and insert bulk events with different date formats', async () => {
    const payload = [
      {
        title: 'All Day Event',
        startDate: '2025-12-25',
        description: 'Should be all day',
      },
      {
        title: 'Timed Event',
        startDate: '2025-12-26 14:00',
        description: 'Should have specific time',
      },
    ]

    const eventsToCreate = payload.map((item) => {
      const parsed = parseEventImportRow(item as any)
      return {
        ...parsed,
        description: parsed.description || '',
        createdById: testUserId,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      } as any
    })

    const result = await prisma.$transaction(async (tx) => {
      return await tx.event.createMany({
        data: eventsToCreate,
      })
    })

    expect(result.count).toBe(2)

    const events = await prisma.event.findMany({
      where: {
        title: { in: ['All Day Event', 'Timed Event'] },
        createdById: testUserId,
      },
    })

    expect(events).toHaveLength(2)

    const allDayEvent = events.find((e) => e.title === 'All Day Event') as any
    const timedEvent = events.find((e) => e.title === 'Timed Event') as any

    expect(allDayEvent?.isAllDay).toBe(true)
    expect(allDayEvent?.startDate.getUTCHours()).toBe(0)

    expect(timedEvent?.isAllDay).toBe(false)
    expect(timedEvent?.startDate.getUTCHours()).toBe(14)

    events.forEach((e) => createdEventIds.push(e.id))
  })
})
