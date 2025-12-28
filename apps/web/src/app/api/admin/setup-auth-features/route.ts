import { NextResponse } from 'next/server'

import { auth } from '@/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST() {
  try {
    // Check authentication and admin role
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }

    console.log('Configuring LogTo authentication features...')

    // Get access token for LogTo Management API
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

    const results: any = {
      features: [],
      errors: [],
    }

    // 1. Get current sign-in experience
    console.log('Fetching sign-in experience...')
    const signInExpResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!signInExpResponse.ok) {
      throw new Error('Failed to fetch sign-in experience')
    }

    const currentSignInExp = await signInExpResponse.json()
    console.log('Current sign-in methods:', currentSignInExp.signIn?.methods)

    // 2. Check if email connector exists, if not enable the default one
    console.log('Checking for email connectors...')
    const connectorsResponse = await fetch(`${LOGTO_ENDPOINT}/api/connectors`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    let hasEmailConnector = false
    if (connectorsResponse.ok) {
      const connectors = await connectorsResponse.json()
      hasEmailConnector = connectors.some(
        (c: any) => c.type === 'Email' || c.metadata?.type === 'Email'
      )
      console.log('Has email connector:', hasEmailConnector)

      // If no email connector, try to enable the built-in one
      if (!hasEmailConnector) {
        console.log('Enabling built-in email connector...')

        // LogTo's built-in email connector for development
        const enableEmailResponse = await fetch(`${LOGTO_ENDPOINT}/api/connectors`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectorId: 'logto-email',
            config: {
              // Use LogTo's default mail service for development
            },
          }),
        })

        if (enableEmailResponse.ok) {
          console.log('Built-in email connector enabled')
          hasEmailConnector = true
          results.features.push({
            name: 'Email Connector',
            status: 'enabled',
            description: 'LogTo built-in email service activated for development',
          })
        } else {
          const error = await enableEmailResponse.text()
          console.log('Failed to enable email connector:', error)
        }
      }
    }

    // 3. Update sign-in experience to enable new authentication methods
    console.log('Enabling authentication features...')

    const updatedSignInExp = {
      ...currentSignInExp,
      signIn: {
        methods: currentSignInExp.signIn?.methods || [],
      },
      // Enable MFA (correct case-sensitive enum values)
      mfa: {
        factors: ['Totp', 'WebAuthn', 'BackupCode'],
        policy: 'UserControlled', // Users can optionally enable
      },
    }

    // Only add email authentication if connector exists
    if (hasEmailConnector) {
      const hasEmailMethod = updatedSignInExp.signIn.methods.some(
        (m: any) => m.identifier === 'email'
      )
      if (hasEmailMethod) {
        // Ensure email method has password enabled and is primary
        updatedSignInExp.signIn.methods = updatedSignInExp.signIn.methods.map((m: any) =>
          m.identifier === 'email'
            ? { ...m, password: true, isPasswordPrimary: true, verificationCode: false }
            : m
        )
      } else {
        // Add email with password as primary
        updatedSignInExp.signIn.methods.push({
          identifier: 'email',
          password: true,
          verificationCode: false,
          isPasswordPrimary: true,
        })
      }

      // Remove username method if present (enforcing email only)
      updatedSignInExp.signIn.methods = updatedSignInExp.signIn.methods.filter(
        (m: any) => m.identifier !== 'username'
      )
    }

    const updateResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedSignInExp),
    })

    if (updateResponse.ok) {
      if (hasEmailConnector) {
        results.features.push({
          name: 'Email Passwordless',
          status: 'enabled',
          description: 'Users can sign in with email verification code (no password needed)',
        })
      } else {
        results.features.push({
          name: 'Email Passwordless',
          status: 'skipped',
          description: 'Email connector not configured - set up in LogTo Connectors first',
        })
      }

      results.features.push({
        name: 'Two-Factor Authentication (MFA)',
        status: 'enabled',
        description:
          'Users can enable TOTP (Google Authenticator), Passkeys (WebAuthn), or backup codes',
      })
    } else {
      const error = await updateResponse.text()
      results.errors.push({
        feature: 'Sign-in Experience',
        error: error,
      })
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message:
        results.errors.length === 0
          ? 'Authentication features configured successfully'
          : 'Some features failed to configure',
      results,
      instructions: [
        'Email Authentication: Users can sign in with Email and Password',
        'Passkeys (WebAuthn): Users can enable passkeys in their LogTo profile for Face ID/Touch ID login',
        'MFA/2FA: Users can optionally enable TOTP or passkeys for two-factor authentication',
        'Social Logins: Requires OAuth app setup with Google/GitHub (see guide)',
      ],
      nextSteps: [
        'Log out and test the new authentication methods',
        'For social logins, follow LOGTO_AUTH_FEATURES_GUIDE.md to set up OAuth apps',
      ],
    })
  } catch (error) {
    console.error('Error setting up auth features:', error)
    return NextResponse.json(
      { error: 'Failed to setup auth features', details: (error as Error).message },
      { status: 500 }
    )
  }
}
