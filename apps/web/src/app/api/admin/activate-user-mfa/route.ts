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

    // Try to update user's MFA settings
    const updateResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${logtoId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isMfaEnabled: true
      })
    })

    const updateResult = await updateResponse.text()
    console.log('MFA activation response:', updateResponse.status, updateResult)

    return NextResponse.json({
      success: updateResponse.ok,
      status: updateResponse.status,
      response: updateResult,
      message: updateResponse.ok ? 'MFA activated' : 'Check if isMfaEnabled field exists'
    })

  } catch (error) {
    console.error('Error activating MFA:', error)
    return NextResponse.json(
      { error: 'Failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

