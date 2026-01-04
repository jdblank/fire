import { NextRequest, NextResponse } from 'next/server'
import { registerUserWithLogTo } from '@/lib/logto-experience'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Register user with LogTo
    const user = await registerUserWithLogTo(email, password, name)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: user.id,
        email: user.primaryEmail,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle specific errors
    if (error.message?.includes('already exists') || error.message?.includes('DuplicateKey')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
