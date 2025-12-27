import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'
import { parseUsersCSV } from '@/lib/csv-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read CSV content
    const text = await file.text()
    
    // Parse and validate CSV
    const parsed = parseUsersCSV(text)

    if (parsed.valid.length === 0) {
      return NextResponse.json({
        error: 'No valid users found in CSV',
        parseErrors: parsed.errors,
      }, { status: 400 })
    }

    // Process users in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const created = []
      const skipped = []
      const errors = []

      for (const row of parsed.valid) {
        try {
          // Check if email already exists
          const existing = await tx.user.findUnique({
            where: { email: row.email },
          })

          if (existing) {
            skipped.push({ email: row.email, reason: 'Email already exists' })
            continue
          }

          // Find referred by user if specified
          let referredById = null
          if (row.referredByEmail) {
            const referrer = await tx.user.findUnique({
              where: { email: row.referredByEmail },
              select: { id: true },
            })
            if (referrer) {
              referredById = referrer.id
            }
          }

          // Create user
          const user = await tx.user.create({
            data: {
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              displayName: `${row.firstName} ${row.lastName}`,
              hometown: row.hometown,
              dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
              mobilePhone: row.mobilePhone,
              referredById,
              accountStatus: 'PENDING_INVITE',
              role: 'USER',
            },
          })

          // Generate invite token
          const inviteToken = await tx.inviteToken.create({
            data: {
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          })

          created.push({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            inviteToken: inviteToken.token,
          })
        } catch (error) {
          errors.push({
            email: row.email,
            error: (error as Error).message,
          })
        }
      }

      return { created, skipped, errors }
    })

    return NextResponse.json({
      success: true,
      summary: {
        total: parsed.valid.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
      parseErrors: parsed.errors,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    )
  }
}

