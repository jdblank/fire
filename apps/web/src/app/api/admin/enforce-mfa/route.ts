import { NextResponse } from 'next/server'

import { auth } from '@/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST() {
  try {
    const session = await auth()
    
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

    // Get current sign-in experience
    const signInExpResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    const currentSignInExp = await signInExpResponse.json()

    // Update MFA policy to Mandatory (enforce for all users who have it set up)
    const updatedSignInExp = {
      ...currentSignInExp,
      mfa: {
        ...currentSignInExp.mfa,
        policy: 'Mandatory' // Change from UserControlled to Mandatory
      }
    }

    const updateResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedSignInExp)
    })

    const result = await updateResponse.text()

    return NextResponse.json({
      success: updateResponse.ok,
      message: updateResponse.ok 
        ? 'MFA is now mandatory for users who have it set up!'
        : 'Failed to update MFA policy',
      details: result
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

