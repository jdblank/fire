import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all active and pending users with referral information
    const users = await prisma.user.findMany({
      where: {
        accountStatus: {
          in: ['ACTIVE', 'PENDING_INVITE']
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        image: true,
        hometown: true,
        referredById: true,
        accountStatus: true,
        eventRegistrations: {
          select: {
            event: {
              select: {
                startDate: true,
                eventType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Transform to include paid event years
    const usersWithYears = users.map(user => {
      // Get unique years from PAID events only
      const paidEventYears = Array.from(
        new Set(
          user.eventRegistrations
            .filter(reg => reg.event.eventType === 'PAID')
            .map(reg => new Date(reg.event.startDate).getFullYear())
        )
      ).sort((a, b) => b - a) // Sort descending (most recent first)
      
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        image: user.image,
        hometown: user.hometown,
        referredById: user.referredById,
        accountStatus: user.accountStatus,
        paidEventYears
      }
    })

    return NextResponse.json(usersWithYears)
  } catch (error) {
    console.error('Error fetching network data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    )
  }
}

