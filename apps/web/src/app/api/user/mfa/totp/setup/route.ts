import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@fire/db'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

// POST /api/user/mfa/totp/setup - Generate TOTP secret and QR code
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's LogTo ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logtoId: true, email: true }
    })

    if (!user?.logtoId) {
      return NextResponse.json({ error: 'User not found in LogTo' }, { status: 404 })
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

    // First, check if TOTP already exists
    const existingResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (existingResponse.ok) {
      const existingMFA = await existingResponse.json()
      const existingTOTP = existingMFA.find((m: any) => m.type === 'Totp')
      
      // If TOTP exists, delete it first to generate a new one
      if (existingTOTP) {
        console.log('Deleting existing TOTP...')
        await fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications/${existingTOTP.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        })
      }
    }

    // Generate new TOTP secret via LogTo API
    const totpResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'Totp'
      })
    })

    if (!totpResponse.ok) {
      const error = await totpResponse.text()
      console.error('TOTP creation error:', error)
      throw new Error(`Failed to generate TOTP: ${error}`)
    }

    const totpData = await totpResponse.json()
    console.log('TOTP created:', totpData)

    // Generate QR code URL
    const qrCodeUrl = `otpauth://totp/Fire:${encodeURIComponent(user.email)}?secret=${totpData.secret}&issuer=Fire`

    return NextResponse.json({
      secret: totpData.secret,
      qrCode: qrCodeUrl,
      verificationId: totpData.id
    })

  } catch (error) {
    console.error('TOTP setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup TOTP', details: (error as Error).message },
      { status: 500 }
    )
  }
}

