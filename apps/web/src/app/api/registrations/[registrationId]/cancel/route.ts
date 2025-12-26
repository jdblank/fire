import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@fire/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        event: {
          select: {
            eventType: true,
            title: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Verify user owns this registration
    if (registration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow canceling FREE events
    if (registration.event.eventType === 'PAID') {
      return NextResponse.json({ 
        error: 'Cannot cancel paid event registration. Please contact an administrator for refunds.' 
      }, { status: 400 })
    }

    // Cancel the registration
    await prisma.eventRegistration.update({
      where: { id: params.registrationId },
      data: {
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Registration for "${registration.event.title}" has been cancelled.`
    })

  } catch (error) {
    console.error('Error cancelling registration:', error)
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    )
  }
}

