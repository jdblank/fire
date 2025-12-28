import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

// GET /api/user/mfa - Get user's MFA status
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's LogTo ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logtoId: true }
    })

    if (!user?.logtoId) {
      return NextResponse.json({ 
        mfaEnabled: false,
        methods: []
      })
    }

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

    // Get user's MFA verifications from LogTo
    const mfaResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (mfaResponse.ok) {
      const mfaData = await mfaResponse.json()
      return NextResponse.json({
        mfaEnabled: mfaData.length > 0,
        methods: mfaData.map((m: any) => ({
          type: m.type,
          createdAt: m.createdAt
        }))
      })
    }

    return NextResponse.json({ 
      mfaEnabled: false,
      methods: []
    })

  } catch (error) {
    console.error('Error fetching MFA status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MFA status' },
      { status: 500 }
    )
  }
}
