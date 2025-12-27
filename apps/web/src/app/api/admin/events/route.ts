import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// GET /api/admin/events - List all events
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const eventType = searchParams.get('eventType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (eventType) {
      where.eventType = eventType
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              displayName: true,
            }
          },
          _count: {
            select: {
              registrations: true,
              lineItems: true,
            }
          }
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/events - Create a new event
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        banner: banner || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        timezone: timezone || 'America/New_York',
        isOnline: isOnline || false,
        eventType: eventType || 'FREE',
        requiresDeposit: requiresDeposit || false,
        depositAmount: depositAmount || null,
        maxAttendees: maxAttendees || null,
        status: status || 'DRAFT',
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          }
        }
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

