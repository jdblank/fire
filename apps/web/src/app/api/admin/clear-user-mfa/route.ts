import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@fire/db'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await request.json()

    // Get user's LogTo ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logtoId: true, email: true }
    })

    if (!user?.logtoId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    // Get all MFA verifications
    const mfaResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!mfaResponse.ok) {
      throw new Error('Failed to fetch MFA verifications')
    }

    const mfaVerifications = await mfaResponse.json()
    console.log('Found MFA verifications:', mfaVerifications)

    // Delete all MFA verifications
    const deletePromises = mfaVerifications.map((verification: any) =>
      fetch(`${LOGTO_ENDPOINT}/api/users/${user.logtoId}/mfa-verifications/${verification.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })
    )

    await Promise.all(deletePromises)

    console.log(`Cleared ${mfaVerifications.length} MFA verifications for ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${mfaVerifications.length} MFA verification(s) for ${user.email}`,
      cleared: mfaVerifications.length
    })

  } catch (error) {
    console.error('Error clearing MFA:', error)
    return NextResponse.json(
      { error: 'Failed to clear MFA', details: (error as Error).message },
      { status: 500 }
    )
  }
}


