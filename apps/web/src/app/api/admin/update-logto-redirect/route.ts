import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const LOGTO_APP_ID = process.env.LOGTO_APP_ID
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST() {
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

    // Update the Fire web application with correct redirect URIs
    const updateResponse = await fetch(`${LOGTO_ENDPOINT}/api/applications/${LOGTO_APP_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oidcClientMetadata: {
          redirectUris: [
            'http://localhost:3000/api/auth/callback/logto'
          ],
          postLogoutRedirectUris: [
            'http://localhost:3000'
          ]
        }
      })
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      return NextResponse.json({
        success: false,
        error: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Redirect URIs updated successfully!',
      redirectUri: 'http://localhost:3000/api/auth/callback/logto',
      postLogoutUri: 'http://localhost:3000'
    })

  } catch (error) {
    console.error('Error updating redirect URIs:', error)
    return NextResponse.json(
      { error: 'Failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}


