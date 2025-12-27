import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// GET /api/registrations/[registrationId] - Get registration details
export async function GET(
  request: Request,
  { params }: { params: { registrationId: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            mobilePhone: true,
          }
        },
        lineItems: {
          include: {
            lineItem: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        discounts: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Security: Only allow user to view their own registration or admins
    if (registration.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error('Error fetching registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

