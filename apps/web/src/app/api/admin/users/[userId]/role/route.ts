import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasRole } from '@/lib/utils'

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

// Map LogTo role names (lowercase) to our role enum
const ROLE_MAP_REVERSE = {
  user: 'USER',
  editor: 'EDITOR',
  admin: 'ADMIN',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get M2M token for LogTo Management API
    const token = await getM2MToken()
    const logtoEndpoint = process.env.LOGTO_ENDPOINT || 'http://logto:3001'

    // Get user's roles from LogTo
    const userRolesResponse = await fetch(`${logtoEndpoint}/api/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!userRolesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch user roles from LogTo' }, { status: 500 })
    }

    const roles = await userRolesResponse.json()

    // Get the first role (we only assign one role per user)
    const primaryRole = roles[0]

    if (!primaryRole) {
      // No role assigned, default to USER
      return NextResponse.json({ role: 'USER' })
    }

    // Map LogTo role name to our enum
    const role = ROLE_MAP_REVERSE[primaryRole.name as keyof typeof ROLE_MAP_REVERSE] || 'USER'

    return NextResponse.json({ role })
  } catch (error: any) {
    console.error('Error fetching user role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user role', details: error.message },
      { status: 500 }
    )
  }
}
