/**
 * LogTo Experience API Client
 * Handles embedded authentication flows (sign in, register, password verification)
 */

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID!
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET!

/**
 * Verify user credentials using LogTo Management API
 * Since ROPC may not be enabled, we verify directly via Management API
 */
export async function verifyPasswordWithLogTo(email: string, password: string) {
  try {
    // Get M2M token for Management API access
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.LOGTO_M2M_APP_ID!,
        client_secret: process.env.LOGTO_M2M_APP_SECRET!,
        resource: 'https://default.logto.app/api',
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get M2M token')
      return null
    }

    const { access_token } = await tokenResponse.json()

    // Find user by email
    const usersResponse = await fetch(
      `${LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    if (!usersResponse.ok) {
      console.error('Failed to search users')
      return null
    }

    const users = await usersResponse.json()
    const user = users.find((u: any) => u.primaryEmail === email)

    if (!user) {
      console.log('User not found:', email)
      return null
    }

    // Verify password
    const verifyResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.id}/password/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ password }),
    })

    // LogTo returns 204 (No Content) for successful verification
    if (verifyResponse.status === 204) {
      // Password is correct - return user data
      return {
        access_token: access_token, // Use M2M token temporarily
        id_token: null, // No ID token without OIDC flow
        user: user, // Pass user object directly
      }
    }

    // Any other status means password failed
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text()
      console.error('Password verification failed:', verifyResponse.status, errorText)
      return null
    }

    // Should not reach here, but handle it
    return null
  } catch (error) {
    console.error('Error verifying password:', error)
    return null
  }
}

/**
 * Register new user via LogTo Management API
 */
export async function registerUserWithLogTo(email: string, password: string, name?: string) {
  try {
    // Get M2M token
    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.LOGTO_M2M_APP_ID!,
        client_secret: process.env.LOGTO_M2M_APP_SECRET!,
        resource: 'https://default.logto.app/api',
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M2M token')
    }

    const { access_token } = await tokenResponse.json()

    // Create user
    const createResponse = await fetch(`${LOGTO_ENDPOINT}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        primaryEmail: email,
        name: name || email.split('@')[0],
        username: email.split('@')[0] + Math.floor(Math.random() * 10000),
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.message || 'Failed to create user')
    }

    const user = await createResponse.json()

    // Set password
    const passwordResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.id}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ password }),
    })

    if (!passwordResponse.ok) {
      const error = await passwordResponse.text()
      console.error('Failed to set password:', error)
      // User created but password failed - still return user
    }

    return user
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

/**
 * Get Management API token (M2M)
 */
export async function getLogToManagementToken() {
  const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: M2M_APP_ID,
      client_secret: M2M_APP_SECRET,
      resource: 'https://default.logto.app/api',
      scope: 'all',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get M2M token')
  }

  const { access_token } = await tokenResponse.json()
  return access_token
}

/**
 * Create LogTo user with password
 */
export async function createLogToUser({
  email,
  password,
  name,
}: {
  email: string
  password: string
  name?: string
}) {
  try {
    const accessToken = await getLogToManagementToken()

    // Create user
    const createResponse = await fetch(`${LOGTO_ENDPOINT}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        primaryEmail: email,
        name: name || email.split('@')[0],
        username: email.split('@')[0] + Math.floor(Math.random() * 10000),
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.message || 'Failed to create user in LogTo')
    }

    const user = await createResponse.json()

    // Set password
    const passwordResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${user.id}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password }),
    })

    if (!passwordResponse.ok) {
      throw new Error('Failed to set password in LogTo')
    }

    return user
  } catch (error) {
    console.error('Error creating LogTo user:', error)
    throw error
  }
}

/**
 * Get user details from LogTo with roles
 */
export async function getUserFromLogTo(userId: string) {
  try {
    // Get M2M token
    console.log('[getUserFromLogTo] Requesting M2M token', {
      endpoint: LOGTO_ENDPOINT,
      hasAppId: !!process.env.LOGTO_M2M_APP_ID,
      hasAppSecret: !!process.env.LOGTO_M2M_APP_SECRET,
    })

    const tokenResponse = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.LOGTO_M2M_APP_ID!,
        client_secret: process.env.LOGTO_M2M_APP_SECRET!,
        resource: 'https://default.logto.app/api',
        scope: 'all',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[getUserFromLogTo] Failed to get M2M token', {
        status: tokenResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to get M2M token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token } = tokenData

    console.log('[getUserFromLogTo] Got M2M token, fetching user', { userId })

    // Get user
    const userResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('[getUserFromLogTo] Failed to get user', {
        status: userResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to get user: ${userResponse.status}`)
    }

    const user = await userResponse.json()
    console.log('[getUserFromLogTo] Got user, fetching roles')

    // Get roles
    const rolesResponse = await fetch(`${LOGTO_ENDPOINT}/api/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text()
      console.error('[getUserFromLogTo] Failed to get roles', {
        status: rolesResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to get roles: ${rolesResponse.status}`)
    }

    const roles = await rolesResponse.json()
    console.log('[getUserFromLogTo] Successfully fetched roles', { roleCount: roles.length })

    return { user, roles }
  } catch (error) {
    console.error('[getUserFromLogTo] Error:', error)
    throw error
  }
}
