#!/usr/bin/env node
/**
 * LogTo Role Setup Script
 * Creates roles and assigns admin role to initial user via Management API
 */

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'josh@lemonade.art'

console.log('🔥 LogTo Role Setup')
console.log('==================\n')

// Get M2M access token
async function getManagementToken() {
  console.log('🔑 Getting Management API token...')

  const response = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get M2M token: ${error}`)
  }

  const data = await response.json()
  console.log('✅ Token obtained\n')
  return data.access_token
}

// Create a role
async function createRole(token, name, description) {
  console.log(`📝 Creating role: ${name}...`)

  const response = await fetch(`${LOGTO_ENDPOINT}/api/roles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      type: 'User', // User role (not machine role)
    }),
  })

  if (response.status === 422) {
    const error = await response.json()
    if (error.code === 'entity.unique_integrity_violation') {
      console.log(`   ℹ️  Role "${name}" already exists`)

      // Get existing role
      const rolesResponse = await fetch(`${LOGTO_ENDPOINT}/api/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const roles = await rolesResponse.json()
      const existingRole = roles.find((r) => r.name === name)
      return existingRole
    }
    throw new Error(`Failed to create role: ${JSON.stringify(error)}`)
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create role: ${error}`)
  }

  const role = await response.json()
  console.log(`✅ Role "${name}" created (ID: ${role.id})\n`)
  return role
}

// Find user by email
async function findUserByEmail(token, email) {
  console.log(`🔍 Finding user: ${email}...`)

  const response = await fetch(`${LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to search users')
  }

  const users = await response.json()
  const user = users.find((u) => u.primaryEmail === email)

  if (!user) {
    console.log(`   ⚠️  User not found: ${email}`)
    console.log(`   Note: User must log in at least once before role assignment\n`)
    return null
  }

  console.log(`✅ User found (ID: ${user.id})\n`)
  return user
}

// Assign role to user
async function assignRoleToUser(token, userId, roleId, roleName) {
  console.log(`👤 Assigning ${roleName} role to user...`)

  const response = await fetch(`${LOGTO_ENDPOINT}/api/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roleIds: [roleId],
    }),
  })

  if (response.status === 422) {
    const error = await response.json()
    if (error.code === 'user.role_exists') {
      console.log(`   ℹ️  User already has ${roleName} role`)
      return
    }
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to assign role: ${error}`)
  }

  console.log(`✅ ${roleName} role assigned!\n`)
}

async function main() {
  try {
    // Validate environment variables
    if (!M2M_APP_ID || !M2M_APP_SECRET) {
      console.error('❌ Error: Missing LogTo M2M credentials')
      console.error('')
      console.error('Please set these environment variables:')
      console.error('  LOGTO_M2M_APP_ID=<your-m2m-app-id>')
      console.error('  LOGTO_M2M_APP_SECRET=<your-m2m-app-secret>')
      console.error('')
      console.error('Get them from: http://localhost:3002 → Applications → Fire Platform Server')
      process.exit(1)
    }

    // Get management token
    const token = await getManagementToken()

    // Create roles
    console.log('📋 Creating Roles\n' + '='.repeat(50) + '\n')

    const userRole = await createRole(token, 'user', 'Regular platform user with basic access')

    const moderatorRole = await createRole(
      token,
      'moderator',
      'Content moderator with elevated permissions'
    )

    const adminRole = await createRole(token, 'admin', 'Platform administrator with full access')

    // Find and promote admin user
    console.log('👤 Promoting Admin User\n' + '='.repeat(50) + '\n')

    const adminUser = await findUserByEmail(token, ADMIN_EMAIL)

    if (adminUser) {
      await assignRoleToUser(token, adminUser.id, adminRole.id, 'admin')
    }

    // Summary
    console.log('📊 Setup Summary\n' + '='.repeat(50))
    console.log('✅ Roles created:')
    console.log(`   - user (ID: ${userRole.id})`)
    console.log(`   - moderator (ID: ${moderatorRole.id})`)
    console.log(`   - admin (ID: ${adminRole.id})`)
    console.log('')

    if (adminUser) {
      console.log(`✅ Admin user configured:`)
      console.log(`   - Email: ${ADMIN_EMAIL}`)
      console.log(`   - Role: admin`)
      console.log('')
      console.log('⚠️  Important: User must log out and log back in for role to take effect!')
    } else {
      console.log(`⚠️  Admin user not found: ${ADMIN_EMAIL}`)
      console.log('   User must log in at least once, then run this script again.')
    }

    console.log('')
    console.log('🎉 LogTo role setup complete!')
    console.log('')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('')
    console.error('Troubleshooting:')
    console.error('  1. Ensure LogTo is running: docker-compose ps')
    console.error('  2. Check M2M credentials are correct')
    console.error('  3. Verify M2M app has Management API permissions')
    process.exit(1)
  }
}

main()
