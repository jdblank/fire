import { NextResponse } from 'next/server'

// Force dynamic
export const dynamic = 'force-dynamic'

// Simple test endpoint to check environment variables
export async function GET() {
  return NextResponse.json({
    message: 'Environment variables test',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      VERCEL: process.env.VERCEL || 'NOT SET',
      LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT || 'NOT SET',
      LOGTO_ISSUER: process.env.LOGTO_ISSUER || 'NOT SET',
      LOGTO_APP_ID: process.env.LOGTO_APP_ID ? 'SET' : 'NOT SET',
      LOGTO_APP_SECRET: process.env.LOGTO_APP_SECRET ? 'SET' : 'NOT SET',
      LOGTO_M2M_APP_ID: process.env.LOGTO_M2M_APP_ID ? 'SET' : 'NOT SET',
      LOGTO_M2M_APP_SECRET: process.env.LOGTO_M2M_APP_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_LOGTO_ENDPOINT: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      S3_ENDPOINT: process.env.S3_ENDPOINT || 'NOT SET',
      S3_BUCKET: process.env.S3_BUCKET || 'NOT SET',
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ? 'SET' : 'NOT SET',
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ? 'SET' : 'NOT SET',
      S3_PUBLIC_URL: process.env.S3_PUBLIC_URL || 'NOT SET',
    },
    timestamp: new Date().toISOString(),
  })
}

