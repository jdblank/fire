import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@fire/db'

// POST /api/admin/users/[userId]/invite - Generate and send invite
export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already active
    if (user.accountStatus === 'ACTIVE') {
      return NextResponse.json({ error: 'User account is already active' }, { status: 400 })
    }

    // Invalidate any existing unused tokens
    await prisma.inviteToken.updateMany({
      where: {
        userId: userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    })

    // Create new invite token (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const inviteToken = await prisma.inviteToken.create({
      data: {
        userId: userId,
        expiresAt,
      },
    })

    // TODO: Send email with invite link
    // For now, we'll just return the invite URL
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${inviteToken.token}`

    return NextResponse.json({
      success: true,
      inviteToken: inviteToken.token,
      inviteUrl,
      expiresAt: inviteToken.expiresAt,
      message: 'Invite generated successfully',
    })
  } catch (error) {
    console.error('Error generating invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
