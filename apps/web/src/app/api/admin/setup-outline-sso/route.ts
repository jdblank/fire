import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { hasRole } from '@/lib/utils'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
// Use LogTo Management API resource identifier
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST() {
  try {
    // Check authentication and admin role
    const session = await auth()

    if (!session || !hasRole(session.user, 'admin')) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }

    console.log('Setting up Outline SSO with LogTo...')

    // Get access token for LogTo Management API
    console.log('Getting access token for Management API...')
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: M2M_APP_ID!,
        client_secret: M2M_APP_SECRET!,
        resource: MANAGEMENT_API_RESOURCE,
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${error}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Check if Outline app already exists
    console.log('Checking for existing Outline application...')
    const listResponse = await fetch(`${LOGTO_ENDPOINT}/api/applications`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!listResponse.ok) {
      const error = await listResponse.text()
      throw new Error(`Failed to list applications: ${listResponse.status} ${error}`)
    }

    const appsData = await listResponse.json()
    console.log('Apps response:', JSON.stringify(appsData).substring(0, 200))

    // LogTo returns an array in the response
    const apps = Array.isArray(appsData) ? appsData : []
    let outlineApp = apps.find((app: any) => app.name === 'Outline Wiki')

    if (!outlineApp) {
      console.log('Creating new Outline application...')

      const createResponse = await fetch(`${LOGTO_ENDPOINT}/api/applications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Outline Wiki',
          type: 'Traditional',
          description: 'Community Wiki and Documentation',
          oidcClientMetadata: {
            redirectUris: ['http://localhost:3004/auth/oidc.callback'],
            postLogoutRedirectUris: ['http://localhost:3004'],
          },
        }),
      })

      if (!createResponse.ok) {
        const error = await createResponse.text()
        throw new Error(`Failed to create application: ${createResponse.status} ${error}`)
      }

      outlineApp = await createResponse.json()
      console.log('Outline application created:', outlineApp.id)
    } else {
      console.log('Outline application already exists:', outlineApp.id)
    }

    // Return configuration to be added manually
    const config = `
  outline:
    environment:
      # OIDC Authentication with LogTo
      OIDC_CLIENT_ID: ${outlineApp.id}
      OIDC_CLIENT_SECRET: ${outlineApp.secret}
      OIDC_AUTH_URI: http://logto:3001/oidc/auth
      OIDC_TOKEN_URI: http://logto:3001/oidc/token
      OIDC_USERINFO_URI: http://logto:3001/oidc/me
      OIDC_DISPLAY_NAME: Fire
      OIDC_USERNAME_CLAIM: email
      OIDC_SCOPES: openid profile email
`

    console.log('Outline application configured:', outlineApp.id)

    return NextResponse.json({
      success: true,
      message: 'Outline application created in LogTo',
      clientId: outlineApp.id,
      clientSecret: outlineApp.secret,
      config: config,
      instructions: [
        'Configuration created successfully',
        'Add the config to docker-compose.override.yml',
        'Run: docker-compose restart outline',
        'Visit: http://localhost:3000/wiki',
      ],
    })
  } catch (error) {
    console.error('Error setting up Outline SSO:', error)
    return NextResponse.json(
      { error: 'Failed to setup Outline SSO', details: (error as Error).message },
      { status: 500 }
    )
  }
}
