import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { logtoId } = await request.json()

    // Get access token
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: M2M_APP_ID!,
        client_secret: M2M_APP_SECRET!,
        resource: MANAGEMENT_API_RESOURCE,
        scope: 'all'
      })
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get MFA verifications
    const mfaResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${logtoId}/mfa-verifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    const mfaData = await mfaResponse.json()

    return NextResponse.json({
      mfaVerifications: mfaData
    })

  } catch (error) {
    console.error('Error checking MFA:', error)
    return NextResponse.json(
      { error: 'Failed to check MFA' },
      { status: 500 }
    )
  }
}

