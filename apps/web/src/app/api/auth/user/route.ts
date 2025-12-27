import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

