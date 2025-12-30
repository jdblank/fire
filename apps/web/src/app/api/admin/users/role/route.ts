import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import { z } from 'zod'
import { hasRole } from '@/lib/utils'

const roleSchema = z.object({
  userId: z.string(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
})

// Map our role enum to LogTo role names (lowercase)
const ROLE_MAP = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
}

// Get M2M access token for LogTo Management API
async function getM2MToken() {
  const logtoEndpoint = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
  const response = await fetch(`${logtoEndpoint}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LOGTO_M2M_APP_ID!,
      client_secret: process.env.LOGTO_M2M_APP_SECRET!,
      resource: 'https://default.logto.app/api',
      scope: 'all',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get M2M token')
  }

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = roleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error },
        { status: 400 }
      )
    }

    const { userId, role } = validation.data

    // Prevent changing your own role
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Get M2M token for LogTo Management API
    const token = await getM2MToken()
    const logtoEndpoint = process.env.LOGTO_ENDPOINT || 'http://logto:3001'

    // Get all role definitions from LogTo
    const rolesResponse = await fetch(`${logtoEndpoint}/api/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const allRoles = await rolesResponse.json()

    // Find the role ID for the desired role
    const targetRole = allRoles.find((r: any) => r.name === ROLE_MAP[role])

    if (!targetRole) {
      return NextResponse.json(
        { error: `Role ${role} not found in LogTo. Run: npm run logto:setup-roles` },
        { status: 404 }
      )
    }

    // Get user's current roles
    const userRolesResponse = await fetch(`${logtoEndpoint}/api/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const currentRoles = await userRolesResponse.json()

    // Remove all current roles
    for (const currentRole of currentRoles) {
      await fetch(`${logtoEndpoint}/api/users/${userId}/roles/${currentRole.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    // Assign new role in LogTo
    await fetch(`${logtoEndpoint}/api/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleIds: [targetRole.id] }),
    })

    // Update user role in our database (cache) - REMOVED
    // Roles are now managed solely in Logto.

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role} in LogTo. User must log out and back in for changes to take effect.`,
    })
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role', details: error.message },
      { status: 500 }
    )
  }
}
