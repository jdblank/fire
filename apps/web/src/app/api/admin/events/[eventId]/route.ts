import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'
import { hasRole } from '@/lib/utils'

// GET /api/admin/events/[eventId] - Get event by ID
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { eventId } = await params
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            lineItems: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/events/[eventId] - Update event
export async function PUT(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { eventId } = await params
    const body = await request.json()
    const {
      title,
      description,
      banner,
      startDate,
      endDate,
      location,
      timezone,
      isOnline,
      eventType,
      requiresDeposit,
      depositAmount,
      maxAttendees,
      status,
    } = body

    // Check if event exists
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(banner !== undefined && { banner }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location !== undefined && { location }),
        ...(timezone !== undefined && { timezone }),
        ...(isOnline !== undefined && { isOnline }),
        ...(eventType && { eventType }),
        ...(requiresDeposit !== undefined && { requiresDeposit }),
        ...(depositAmount !== undefined && { depositAmount }),
        ...(maxAttendees !== undefined && { maxAttendees }),
        ...(status && { status }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/events/[eventId] - Delete event
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { eventId } = await params
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Warn if event has registrations
    if (event._count.registrations > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete event with ${event._count.registrations} registrations. Cancel the event instead.`,
        },
        { status: 400 }
      )
    }

    // Delete event (cascade will handle line items)
    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
