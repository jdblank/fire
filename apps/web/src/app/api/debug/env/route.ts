import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Diagnostic endpoint to check environment variables
// Only available in production to help diagnose issues
export async function GET() {
  // Don't expose secrets, just show if they're set
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT || 'NOT SET',
    LOGTO_ISSUER: process.env.LOGTO_ISSUER || 'NOT SET',
    LOGTO_APP_ID: process.env.LOGTO_APP_ID ? 'SET (hidden)' : 'NOT SET',
    LOGTO_APP_SECRET: process.env.LOGTO_APP_SECRET ? 'SET (hidden)' : 'NOT SET',
    NEXT_PUBLIC_LOGTO_ENDPOINT: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  }

  return NextResponse.json({
    message: 'Environment variables check',
    environment: envCheck,
    timestamp: new Date().toISOString(),
  })
}

