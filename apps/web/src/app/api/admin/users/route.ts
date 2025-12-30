import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'
import { hasRole } from '@/lib/utils'

// GET /api/admin/users - List all users
export async function GET(request: Request) {
  try {
    console.log('GET /api/admin/users - Starting...')
    const session = await auth()
    console.log(
      'Session:',
      session
        ? `User: ${session.user.email}, Roles: ${JSON.stringify(session.user.roles)}`
        : 'No session'
    )

    if (!session || !hasRole(session.user, 'admin')) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log('Admin authenticated, fetching users...')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.accountStatus = status
    }

    console.log('Querying Prisma with where:', JSON.stringify(where))

    let users, total
    try {
      const result = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            referredBy: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                referrals: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ])
      users = result[0]
      total = result[1]
      console.log('Query successful! Found', total, 'users')
    } catch (prismaError) {
      console.error('Prisma query error:', prismaError)
      throw prismaError
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      displayName,
      dateOfBirth,
      mobilePhone,
      countryCode,
      hometown,
      referredById,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        displayName: displayName || `${firstName} ${lastName}`,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        mobilePhone,
        countryCode,
        hometown,
        referredById: referredById || null,
        accountStatus: 'PENDING_INVITE',
      },
      include: {
        referredBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
