import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const OUTLINE_INTERNAL_URL = 'http://outline:3000'
const OUTLINE_PUBLIC_URL = 'http://localhost:3004'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated in Fire
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log('SSO request for user:', session.user.email)

    // Since user is already authenticated in Fire via LogTo,
    // redirect them to Outline's OIDC endpoint with prompt=none
    // This tells LogTo to use the existing session without prompting
    const authUrl = new URL(`${OUTLINE_PUBLIC_URL}/auth/oidc`)
    authUrl.searchParams.set('prompt', 'none')
    
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Wiki SSO error:', error)
    return NextResponse.redirect(new URL('/wiki', request.url))
  }
}

