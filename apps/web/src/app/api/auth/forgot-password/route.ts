import { NextRequest, NextResponse } from 'next/server'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const LOGTO_M2M_APP_ID = process.env.LOGTO_M2M_APP_ID!
const LOGTO_M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get M2M token for Management API access
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: LOGTO_M2M_APP_ID,
        client_secret: LOGTO_M2M_APP_SECRET,
        resource: 'https://default.logto.app/api',
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get M2M token')
      // Don't reveal this error to user
      return NextResponse.json(
        { success: true, message: 'If an account exists, you will receive reset instructions.' },
        { status: 200 }
      )
    }

    const { access_token } = await tokenResponse.json()

    // Find user by email
    const usersResponse = await fetch(
      `${LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`,
      {
        headers: { 'Authorization': `Bearer ${access_token}` },
      }
    )

    if (!usersResponse.ok) {
      console.error('Failed to search users')
      // Don't reveal this error to user
      return NextResponse.json(
        { success: true, message: 'If an account exists, you will receive reset instructions.' },
        { status: 200 }
      )
    }

    const users = await usersResponse.json()
    const user = users.find((u: any) => u.primaryEmail === email)

    if (!user) {
      // Don't reveal that user doesn't exist (security best practice)
      return NextResponse.json(
        { success: true, message: 'If an account exists, you will receive reset instructions.' },
        { status: 200 }
      )
    }

    // TODO: Implement actual password reset logic
    // For now, we'll log instructions for manual reset via LogTo admin
    console.log(`Password reset requested for user: ${user.id} (${email})`)
    console.log(`Manual reset: Go to LogTo admin → Users → ${email} → Reset password`)

    // In production, you would:
    // 1. Generate a secure reset token
    // 2. Store it in database with expiration
    // 3. Send email with reset link
    // 4. Create reset-password page to handle token verification

    return NextResponse.json(
      { 
        success: true, 
        message: 'If an account exists, you will receive reset instructions.',
        // For development: include manual reset instructions
        dev_note: process.env.NODE_ENV === 'development' 
          ? `For now, reset password manually in LogTo admin console: http://localhost:3002 → Users → ${email}` 
          : undefined
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}












