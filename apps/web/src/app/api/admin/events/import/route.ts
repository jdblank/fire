import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@fire/db'
import { hasRole } from '@/lib/utils'
import { parseEventImportRow } from '@/lib/import-utils'
import { createEventSchema, csvEventImportSchema } from '@fire/types'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input: expected an array of events' }, { status: 400 })
    }

    const eventsToCreate: any[] = []

    // Step 2: Validation & Parsing
    for (const item of body) {
      // Basic CSV row validation
      const csvRowResult = csvEventImportSchema.safeParse(item)
      if (!csvRowResult.success) {
        return NextResponse.json({ 
          error: 'Invalid CSV row format', 
          details: csvRowResult.error.format() 
        }, { status: 400 })
      }

      // Parse using import-utils
      const parsedRow = parseEventImportRow(csvRowResult.data)

      // Validate against DB schema
      const dbValidationResult = createEventSchema.safeParse(parsedRow)
      if (!dbValidationResult.success) {
        return NextResponse.json({ 
          error: 'Row failed database validation', 
          details: dbValidationResult.error.format() 
        }, { status: 400 })
      }

      // Final normalization for database
      const finalData = dbValidationResult.data
      const startDate = new Date(finalData.startDate)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: `Invalid start date: ${finalData.startDate}` }, { status: 400 })
      }

      let endDate: Date | null = null
      if (finalData.endDate) {
        endDate = new Date(finalData.endDate)
        if (isNaN(endDate.getTime())) {
          return NextResponse.json({ error: `Invalid end date: ${finalData.endDate}` }, { status: 400 })
        }
      }

      eventsToCreate.push({
        title: finalData.title,
        description: finalData.description || '',
        banner: finalData.banner,
        location: finalData.location,
        isOnline: finalData.isOnline,
        isAllDay: finalData.isAllDay,
        // price/currency/maxAttendees mapping
        price: finalData.price,
        currency: finalData.currency,
        maxAttendees: finalData.maxAttendees,
        startDate,
        endDate,
        createdById: session.user.id,
        status: 'PUBLISHED',
      })
    }

    // Step 3: Database Insertion
    let createdCount = 0
    for (const data of eventsToCreate) {
      await prisma.event.create({
        data,
      })
      createdCount++
    }

    return NextResponse.json({ 
      success: true, 
      count: createdCount 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in bulk import:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: errorMessage,
      details: error instanceof Error ? { stack: error.stack, message: error.message } : error
    }, { status: 500 })
  }
}
