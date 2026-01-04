import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: 'apps/web/.env' })

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://localhost:3001'
const LOGTO_M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const LOGTO_M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const LOGTO_API_RESOURCE = process.env.LOGTO_API_RESOURCE || 'https://api.fire-platform.local'

const ROLES_TO_SEED = [
  { name: 'admin', description: 'Full system administrator rights' },
  { name: 'editor', description: 'Can post news/events, cannot delete users' },
  { name: 'user', description: 'Standard user: profile management, comments, likes' },
]

async function getAccessToken() {
  const response = await fetch(LOGTO_ENDPOINT + '/oidc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: LOGTO_M2M_APP_ID!,
      client_secret: LOGTO_M2M_APP_SECRET!,
      resource: LOGTO_API_RESOURCE,
      scope: 'all',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('Failed to get access token: ' + error)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

async function getRoles(accessToken: string) {
  const response = await fetch(LOGTO_ENDPOINT + '/api/roles', {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('Failed to get roles: ' + error)
  }

  return (await response.json()) as Array<{ id: string; name: string }>
}

async function createRole(accessToken: string, name: string, description: string) {
  const response = await fetch(LOGTO_ENDPOINT + '/api/roles', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error('Failed to create role ' + name + ': ' + error)
  }

  return await response.json()
}

async function main() {
  console.log('🔧 Seeding roles in LogTo...')

  if (!LOGTO_M2M_APP_ID || !LOGTO_M2M_APP_SECRET) {
    throw new Error('Missing LOGTO_M2M_APP_ID or LOGTO_M2M_APP_SECRET environment variables')
  }

  console.log('🔑 Getting access token...')
  const accessToken = await getAccessToken()

  console.log('📋 Fetching existing roles...')
  const existingRoles = await getRoles(accessToken)
  const existingRoleNames = existingRoles.map((r) => r.name)

  console.log('Found ' + existingRoles.length + ' existing roles:', existingRoleNames)

  for (const role of ROLES_TO_SEED) {
    if (existingRoleNames.includes(role.name)) {
      console.log('✓ Role "' + role.name + '" already exists, skipping')
    } else {
      console.log('➕ Creating role "' + role.name + '"...')
      await createRole(accessToken, role.name, role.description)
      console.log('✓ Role "' + role.name + '" created successfully')
    }
  }

  console.log('✅ Role seeding complete!')
}

main().catch((error) => {
  console.error('❌ Error seeding roles:', error)
  process.exit(1)
})
