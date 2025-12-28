import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// GET /api/admin/events/[eventId]/line-items - List all line items for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const lineItems = await prisma.eventLineItem.findMany({
      where: { eventId: eventId },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ lineItems })
  } catch (error) {
    console.error('Error fetching line items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/events/[eventId]/line-items - Create a new line item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      lineItemType,
      isRequired,
      calculationMethod,
      baseAmount,
      minAmount,
      maxAmount,
      multiplier,
      sortOrder,
    } = body

    // Validate required fields
    if (!name || !lineItemType || !calculationMethod) {
      return NextResponse.json(
        { error: 'Name, line item type, and calculation method are required' },
        { status: 400 }
      )
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get next sort order if not provided
    let order = sortOrder
    if (order === undefined || order === null) {
      const maxOrder = await prisma.eventLineItem.findFirst({
        where: { eventId: eventId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      })
      order = (maxOrder?.sortOrder || 0) + 1
    }

    // Create line item
    const lineItem = await prisma.eventLineItem.create({
      data: {
        eventId: eventId,
        name,
        description: description || null,
        lineItemType,
        isRequired: isRequired || false,
        calculationMethod,
        baseAmount: baseAmount || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        multiplier: multiplier || null,
        sortOrder: order,
      }
    })

    return NextResponse.json({ lineItem }, { status: 201 })
  } catch (error) {
    console.error('Error creating line item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
