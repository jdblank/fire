import { NextResponse } from 'next/server'
import { prisma } from '@fire/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Simple health check endpoint for Railway and monitoring
// Also includes environment variable check for debugging
export async function GET(request: Request) {
  const url = new URL(request.url)
  const checkEnv = url.searchParams.get('env') === 'true'

  // If ?env=true, return environment variable check (skip database)
  if (checkEnv) {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    // Show first part of URL for debugging (but hide password)
    const dbUrlPreview =
      dbUrl !== 'NOT SET'
        ? dbUrl.split('@')[0] +
          '@' +
          (dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] + '/...' : 'hidden')
        : 'NOT SET'

    return NextResponse.json({
      message: 'Environment variables check',
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT || 'NOT SET',
        LOGTO_ISSUER: process.env.LOGTO_ISSUER || 'NOT SET',
        LOGTO_APP_ID: process.env.LOGTO_APP_ID ? 'SET (hidden)' : 'NOT SET',
        LOGTO_APP_SECRET: process.env.LOGTO_APP_SECRET ? 'SET (hidden)' : 'NOT SET',
        NEXT_PUBLIC_LOGTO_ENDPOINT: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'NOT SET',
        DATABASE_URL: dbUrlPreview,
        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Normal health check
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        app: 'ok',
        database: 'ok',
      },
      // Hint about env check
      _hint: 'Add ?env=true to check environment variables',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        errorMessage: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        // Hint about env check
        _hint: 'Add ?env=true to check environment variables',
        _note: 'This error usually means DATABASE_URL is missing or invalid',
      },
      { status: 503 }
    )
  }
}
