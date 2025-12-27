import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// GET /api/user/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        referredBy: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      displayName,
      hometown,
      dateOfBirth,
      mobilePhone,
    } = body

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(displayName !== undefined && { displayName }),
        ...(hometown !== undefined && { hometown }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(mobilePhone !== undefined && { mobilePhone }),
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

