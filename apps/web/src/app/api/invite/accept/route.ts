import { NextResponse } from 'next/server'
import { prisma } from '@fire/db'
import { createLogToUser } from '@/lib/logto-experience'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Find invite token
    const inviteToken = await prisma.inviteToken.findUnique({
      where: { token },
      include: {
        user: true
      }
    })

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    // Check if already used
    if (inviteToken.usedAt) {
      return NextResponse.json(
        { error: 'Invite token has already been used' },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date() > inviteToken.expiresAt) {
      return NextResponse.json(
        { error: 'Invite token has expired' },
        { status: 400 }
      )
    }

    const user = inviteToken.user

    // Check if user already has a LogTo account
    if (user.logtoId) {
      return NextResponse.json(
        { error: 'User already has an active account' },
        { status: 400 }
      )
    }

    // Create LogTo user
    try {
      const logtoUser = await createLogToUser({
        email: user.email,
        password,
        name: user.displayName || `${user.firstName} ${user.lastName}`.trim(),
      })

      // Update our database
      await prisma.$transaction([
        // Update user with LogTo ID and activate account
        prisma.user.update({
          where: { id: user.id },
          data: {
            logtoId: logtoUser.id,
            accountStatus: 'ACTIVE',
            emailVerified: new Date(),
          }
        }),
        // Mark invite token as used
        prisma.inviteToken.update({
          where: { id: inviteToken.id },
          data: {
            usedAt: new Date()
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Account activated successfully'
      })
    } catch (logtoError: any) {
      console.error('Error creating LogTo user:', logtoError)
      return NextResponse.json(
        { error: logtoError.message || 'Failed to create account' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
