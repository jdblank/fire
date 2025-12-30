import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'
import { hasRole } from '@/lib/utils'

// PUT /api/admin/events/[eventId]/line-items/[itemId] - Update line item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string; itemId: string }> }
) {
  try {
    const { eventId, itemId } = await params
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
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

    // Check if line item exists and belongs to this event
    const existing = await prisma.eventLineItem.findFirst({
      where: {
        id: itemId,
        eventId: eventId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 })
    }

    // Update line item
    const lineItem = await prisma.eventLineItem.update({
      where: { id: itemId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(lineItemType && { lineItemType }),
        ...(isRequired !== undefined && { isRequired }),
        ...(calculationMethod && { calculationMethod }),
        ...(baseAmount !== undefined && { baseAmount }),
        ...(minAmount !== undefined && { minAmount }),
        ...(maxAmount !== undefined && { maxAmount }),
        ...(multiplier !== undefined && { multiplier }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ lineItem })
  } catch (error) {
    console.error('Error updating line item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[eventId]/line-items/[itemId] - Delete line item
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; itemId: string }> }
) {
  try {
    const { eventId, itemId } = await params
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if line item exists and belongs to this event
    const lineItem = await prisma.eventLineItem.findFirst({
      where: {
        id: itemId,
        eventId: eventId,
      },
      include: {
        _count: {
          select: { registrationLineItems: true },
        },
      },
    })

    if (!lineItem) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 })
    }

    // Warn if line item is used in registrations
    if (lineItem._count.registrationLineItems > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete line item used in ${lineItem._count.registrationLineItems} registrations`,
        },
        { status: 400 }
      )
    }

    // Delete line item
    await prisma.eventLineItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting line item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
