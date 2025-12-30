import 'dotenv/config'
import fetch from 'node-fetch'

const LOGTO_ENDPOINT = process.env.DEV_LOGTO_ENDPOINT
  ? process.env.DEV_LOGTO_ENDPOINT.replace(/\/$/, '')
  : undefined
const APP_ID = process.env.DEV_M2M_ID
const APP_SECRET = process.env.DEV_M2M_SECRET

const ROLES_TO_SEED = [
  { name: 'admin', description: 'Full system administrator rights' },
  { name: 'editor', description: 'Can post news/events, cannot delete users' },
  { name: 'user', description: 'Standard user: profile management, comments, likes' },
]

async function getAccessToken() {
  if (!LOGTO_ENDPOINT || !APP_ID || !APP_SECRET) {
    throw new Error(
      'Missing environment variables: DEV_LOGTO_ENDPOINT, DEV_M2M_ID, or DEV_M2M_SECRET'
    )
  }

  const tokenUrl = `${LOGTO_ENDPOINT}/oidc/token`
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', APP_ID)
  params.append('client_secret', APP_SECRET)
  params.append('resource', 'https://default.logto.app/api')
  params.append('scope', 'all')

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to get access token: ${response.status} ${response.statusText}\n${text}`
    )
  }

  const data: any = await response.json()
  return data.access_token
}

async function fetchJson(url: string, token: string, options: any = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `API Request Failed: ${options.method || 'GET'} ${url} - ${response.status}\n${text}`
    )
  }

  if (response.status === 204) return null

  return response.json()
}

async function main() {
  console.log('Starting Role Seeding...')

  try {
    const token = await getAccessToken()
    console.log('Authenticated successfully.')

    const currentRoles: any[] = await fetchJson(`${LOGTO_ENDPOINT}/api/roles`, token)
    console.log(`Fetched ${currentRoles.length} existing roles.`)

    for (const roleDef of ROLES_TO_SEED) {
      const existingRole = currentRoles.find((r: any) => r.name === roleDef.name)

      if (existingRole) {
        console.log(`Skipping role "${roleDef.name}" (already exists).`)
      } else {
        console.log(`Creating role "${roleDef.name}"...`)
        try {
          await fetchJson(`${LOGTO_ENDPOINT}/api/roles`, token, {
            method: 'POST',
            body: JSON.stringify({
              name: roleDef.name,
              description: roleDef.description,
              type: 'User',
            }),
          })
          console.log(`  -> Success: Created "${roleDef.name}"`)
        } catch (e: any) {
          console.error(`  -> Failed to create "${roleDef.name}": ${e.message}`)
        }
      }
    }

    console.log('Role seeding completed.')
  } catch (error: any) {
    console.error('Fatal Error:', error.message)
    process.exit(1)
  }
}

main()
