import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@fire/db'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lineItems, totalAmount } = body

    // Verify event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Event is not open for registration' }, { status: 400 })
    }

    // Check if user is already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId: params.eventId,
        userId: session.user.id
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 })
    }

    // Check capacity
    if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
      return NextResponse.json({ error: 'Event is at full capacity' }, { status: 400 })
    }

    // Calculate deposit and balance
    const depositRequired = event.requiresDeposit && event.depositAmount 
      ? parseFloat(event.depositAmount.toString())
      : 0
    const balanceDue = totalAmount - 0 // No payment yet
    
    // Create registration with line items
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: params.eventId,
        userId: session.user.id,
        status: 'PENDING',
        totalAmount,
        depositPaid: 0,
        balanceDue: totalAmount,
        paymentStatus: 'UNPAID',
        registeredById: session.user.id,
        lineItems: {
          create: lineItems.map((item: any) => ({
            lineItemId: item.lineItemId,
            quantity: item.quantity || 1,
            calculatedAmount: item.calculatedAmount,
            userAge: item.userAge,
            notes: item.notes || null,
          }))
        }
      },
      include: {
        lineItems: {
          include: {
            lineItem: true
          }
        },
        event: true
      }
    })

    return NextResponse.json({ 
      success: true,
      registration,
      message: 'Registration successful!'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

