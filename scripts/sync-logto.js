require('dotenv').config()
const fetch = require('node-fetch')

// REPLACE_MAP for Production Domain Replacement
const REPLACE_MAP = {
  'http://localhost:3000': 'https://fire.lemonade.art',
  'http://localhost:3001': 'https://auth.lemonade.art',
}

// Configuration
const DEV_ENDPOINT = process.env.DEV_LOGTO_ENDPOINT
  ? process.env.DEV_LOGTO_ENDPOINT.replace(/\/$/, '')
  : undefined
const DEV_APP_ID = process.env.DEV_M2M_ID
const DEV_APP_SECRET = process.env.DEV_M2M_SECRET

const PROD_ENDPOINT = process.env.PROD_LOGTO_ENDPOINT
  ? process.env.PROD_LOGTO_ENDPOINT.replace(/\/$/, '')
  : undefined
const PROD_APP_ID = process.env.PROD_M2M_ID
const PROD_APP_SECRET = process.env.PROD_M2M_SECRET

// Helper: Process Payload (Replace Domains)
function processPayload(payload) {
  let str = JSON.stringify(payload)
  for (const [key, value] of Object.entries(REPLACE_MAP)) {
    str = str.split(key).join(value)
  }
  return JSON.parse(str)
}

// Helper: Get Access Token
async function getAccessToken(endpoint, appId, appSecret) {
  const tokenUrl = `${endpoint}/oidc/token`
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', appId)
  params.append('client_secret', appSecret)
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
      `Failed to get access token from ${endpoint}: ${response.status} ${response.statusText}\n${text}`
    )
  }

  const data = await response.json()
  return data.access_token
}

// Helper: Fetch JSON
async function fetchJson(url, token, options = {}) {
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

async function syncApplications(devToken, prodToken) {
  console.log('\n--- Syncing Applications ---')

  const devApps = await fetchJson(`${DEV_ENDPOINT}/api/applications`, devToken)
  console.log(`Found ${devApps.length} apps in Dev.`)

  const prodApps = await fetchJson(`${PROD_ENDPOINT}/api/applications`, prodToken)
  console.log(`Found ${prodApps.length} apps in Prod.`)

  for (const app of devApps) {
    if (app.type === 'MachineToMachine') {
      console.log(`Skipping M2M app: ${app.name}`)
      continue
    }

    console.log(`Processing app: ${app.name} (${app.type})`)

    const existingProdApp = prodApps.find((p) => p.name === app.name)

    const { id, secret, users, ...rawPayload } = app

    delete rawPayload.isThirdParty
    delete rawPayload.createdAt
    delete rawPayload.protectedAppMetadata

    const payload = processPayload(rawPayload)

    if (existingProdApp) {
      console.log(`  -> Updating existing app in Prod: ${existingProdApp.id}`)
      try {
        await fetchJson(`${PROD_ENDPOINT}/api/applications/${existingProdApp.id}`, prodToken, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        console.log(`  -> Updated successfully.`)
      } catch (e) {
        console.error(`  -> Failed to update: ${e.message}`)
      }
    } else {
      console.log(`  -> Creating new app in Prod`)
      try {
        await fetchJson(`${PROD_ENDPOINT}/api/applications`, prodToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        console.log(`  -> Created successfully.`)
      } catch (e) {
        console.error(`  -> Failed to create: ${e.message}`)
      }
    }
  }
}

async function syncRoles(devToken, prodToken) {
  console.log('\n--- Syncing Roles ---')

  const devRoles = await fetchJson(`${DEV_ENDPOINT}/api/roles`, devToken)
  console.log(`Found ${devRoles.length} roles in Dev.`)

  const prodRoles = await fetchJson(`${PROD_ENDPOINT}/api/roles`, prodToken)

  const SKIP_ROLES = ['admin', 'user', 'anonymous']

  for (const role of devRoles) {
    if (SKIP_ROLES.includes(role.name) || role.type === 'BuiltIn') {
      console.log(`Skipping built-in/reserved role: ${role.name}`)
      continue
    }

    console.log(`Processing role: ${role.name}`)

    const existingProdRole = prodRoles.find((p) => p.name === role.name)

    const { id, ...rawPayload } = role
    delete rawPayload.createdAt
    delete rawPayload.isBuiltIn

    const payload = processPayload(rawPayload)

    if (existingProdRole) {
      console.log(`  -> Role exists in Prod (${existingProdRole.id}). Skipping creation.`)
    } else {
      console.log(`  -> Creating new role in Prod`)
      try {
        await fetchJson(`${PROD_ENDPOINT}/api/roles`, prodToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        console.log(`  -> Created successfully.`)
      } catch (e) {
        console.error(`  -> Failed to create: ${e.message}`)
      }
    }
  }
}

async function syncBranding(devToken, prodToken) {
  console.log('\n--- Syncing Sign-in Experience (Branding) ---')

  try {
    const experience = await fetchJson(`${DEV_ENDPOINT}/api/sign-in-exp`, devToken)
    console.log('Fetched sign-in experience from Dev.')

    // Only sync UI/Branding fields to avoid errors with missing connectors in Prod
    // We exclude: signIn, signUp, socialSignIn, mfa, passwordPolicy, etc.
    const UI_FIELDS = [
      'branding',
      'color',
      'customCss',
      'customContent',
      'languageInfo',
      'termsOfUseUrl',
      'privacyPolicyUrl',
      'hideLogtoBranding',
      'signInMode',
      'agreeToTermsPolicy',
    ]

    const payload = {}
    for (const key of UI_FIELDS) {
      if (experience[key] !== undefined) {
        payload[key] = experience[key]
      }
    }

    if (experience.customUiAssets) {
      console.warn(
        'Warning: customUiAssets found in Dev but cannot be synced automatically. Please upload assets manually in Prod.'
      )
    }

    const processedPayload = processPayload(payload)

    await fetchJson(`${PROD_ENDPOINT}/api/sign-in-exp`, prodToken, {
      method: 'PATCH',
      body: JSON.stringify(processedPayload),
    })
    console.log('Sign-in experience (UI/Branding) synced to Prod successfully.')
  } catch (e) {
    console.error(`Failed to sync sign-in experience: ${e.message}`)
  }
}

async function syncPhrases(devToken, prodToken) {
  console.log('\n--- Syncing Custom Phrases ---')

  try {
    const phrases = await fetchJson(`${DEV_ENDPOINT}/api/custom-phrases`, devToken)
    console.log(`Fetched ${phrases.length} custom phrases from Dev.`)

    for (const item of phrases) {
      const { languageTag, translation } = item
      const payload = processPayload(translation)

      console.log(`  -> Syncing phrases for ${languageTag}`)
      await fetchJson(`${PROD_ENDPOINT}/api/custom-phrases/${languageTag}`, prodToken, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    }
    console.log('Custom phrases synced to Prod successfully.')
  } catch (e) {
    console.error(`Failed to sync custom phrases: ${e.message}`)
  }
}

async function main() {
  console.log('Starting Logto Sync...')

  const REQUIRED_ENV = [
    'DEV_LOGTO_ENDPOINT',
    'DEV_M2M_ID',
    'DEV_M2M_SECRET',
    'PROD_LOGTO_ENDPOINT',
    'PROD_M2M_ID',
    'PROD_M2M_SECRET',
  ]

  const missing = REQUIRED_ENV.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`)
    console.log('Please check .env file or .env.template for reference.')
    process.exit(1)
  }

  try {
    console.log('Authenticating with Dev...')
    const devToken = await getAccessToken(DEV_ENDPOINT, DEV_APP_ID, DEV_APP_SECRET)
    console.log('Authenticating with Prod...')
    const prodToken = await getAccessToken(PROD_ENDPOINT, PROD_APP_ID, PROD_APP_SECRET)

    await syncApplications(devToken, prodToken)
    await syncRoles(devToken, prodToken)
    await syncBranding(devToken, prodToken)
    await syncPhrases(devToken, prodToken)

    console.log('\nSync completed successfully.')
  } catch (error) {
    console.error('\nFatal Error:', error.message)
    process.exit(1)
  }
}

main()
