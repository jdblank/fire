import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Verify current password and update to new password via LogTo
    const { verifyPasswordWithLogTo } = await import('@/lib/logto-experience')
    
    // Verify current password
    const verifyResult = await verifyPasswordWithLogTo(session.user.email!, currentPassword)
    
    if (!verifyResult) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Update to new password via LogTo Management API
    const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT
    const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
    const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET

    // Get M2M token
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: M2M_APP_ID!,
        client_secret: M2M_APP_SECRET!,
        resource: 'https://default.logto.app/api',
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get M2M token for password change')
      return NextResponse.json(
        { error: 'Failed to authenticate with LogTo' },
        { status: 500 }
      )
    }

    const { access_token } = await tokenResponse.json()

    // Update password
    const passwordResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${session.user.id}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    })

    if (!passwordResponse.ok) {
      const error = await passwordResponse.text()
      console.error('Failed to update password in LogTo:', error)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

