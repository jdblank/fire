import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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

    // Get connectors
    const connectorsResponse = await fetch(`${LOGTO_ENDPOINT}/api/connectors`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    const connectors = await connectorsResponse.json()

    return NextResponse.json({
      connectors: connectors.map((c: any) => ({
        id: c.id,
        name: c.name || c.id,
        type: c.type || c.metadata?.type,
        enabled: c.enabled,
        config: c.config ? Object.keys(c.config) : []
      }))
    })

  } catch (error) {
    console.error('Error checking connectors:', error)
    return NextResponse.json(
      { error: 'Failed to check connectors' },
      { status: 500 }
    )
  }
}


