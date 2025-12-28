import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// POST /api/admin/registrations - Admin creates registration for a user
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      eventId,
      userId,
      lineItems,
      totalAmount,
      depositPaid,
      paymentStatus,
      adminOverride,
      overrideNote,
    } = body

    // Validate required fields
    if (!eventId || !userId) {
      return NextResponse.json({ error: 'Event ID and User ID are required' }, { status: 400 })
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User is already registered for this event' },
        { status: 400 }
      )
    }

    const balanceDue = totalAmount - (depositPaid || 0)

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: 'CONFIRMED',
        totalAmount: totalAmount || 0,
        depositPaid: depositPaid || 0,
        balanceDue,
        paymentStatus: paymentStatus || 'UNPAID',
        adminOverride: adminOverride || true,
        overrideNote: overrideNote || 'Registered by admin',
        registeredById: session.user.id,
        lineItems: lineItems
          ? {
              create: lineItems.map((item: any) => ({
                lineItemId: item.lineItemId,
                quantity: item.quantity || 1,
                calculatedAmount: item.calculatedAmount,
                userAge: item.userAge,
                notes: item.notes || null,
              })),
            }
          : undefined,
      },
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
        event: true,
        lineItems: {
          include: {
            lineItem: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        registration,
        message: 'Registration created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
