import 'dotenv/config'
import fetch from 'node-fetch'

// Define Roles
const ROLES = [
  { name: 'admin', description: 'Full system administrator rights' },
  { name: 'editor', description: 'Can post news/events, cannot delete users' },
  { name: 'user', description: 'Standard user: profile management, comments, likes' },
]

// Configuration logic
const ARGS = process.argv.slice(2)
const TARGET_ARG = ARGS.find((arg) => arg.startsWith('--target='))
const TARGET = TARGET_ARG ? TARGET_ARG.split('=')[1] : null

if (TARGET !== 'dev' && TARGET !== 'prod') {
  console.error('Error: Please provide a valid target via --target=dev or --target=prod')
  process.exit(1)
}

const ENV_CONFIG = {
  dev: {
    ENDPOINT: process.env.DEV_LOGTO_ENDPOINT,
    APP_ID: process.env.DEV_M2M_ID,
    APP_SECRET: process.env.DEV_M2M_SECRET,
    BASE_APP_URL: 'http://localhost:3000',
  },
  prod: {
    ENDPOINT: process.env.PROD_LOGTO_ENDPOINT,
    APP_ID: process.env.PROD_M2M_ID,
    APP_SECRET: process.env.PROD_M2M_SECRET,
    BASE_APP_URL: 'https://fire.lemonade.art',
  },
}

const CONFIG = ENV_CONFIG[TARGET as 'dev' | 'prod']

if (!CONFIG.ENDPOINT || !CONFIG.APP_ID || !CONFIG.APP_SECRET) {
  console.error(`Error: Missing environment variables for target ${TARGET}.`)
  console.error(
    `Checked: ${TARGET === 'dev' ? 'DEV_LOGTO_ENDPOINT, DEV_M2M_ID, DEV_M2M_SECRET' : 'PROD_LOGTO_ENDPOINT, PROD_M2M_ID, PROD_M2M_SECRET'}`
  )
  process.exit(1)
}

// Normalize endpoint
const LOGTO_ENDPOINT = CONFIG.ENDPOINT.replace(/\/$/, '')
const BASE_APP_URL = CONFIG.BASE_APP_URL

// Helper: Get Access Token
async function getAccessToken() {
  const tokenUrl = `${LOGTO_ENDPOINT}/oidc/token`
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', CONFIG.APP_ID!)
  params.append('client_secret', CONFIG.APP_SECRET!)
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

// Helper: Fetch JSON
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

// Step 1: Sync Roles
async function syncRoles(token: string) {
  console.log('\n--- Syncing Roles ---')
  const currentRoles: any[] = await fetchJson(`${LOGTO_ENDPOINT}/api/roles`, token)

  for (const roleDef of ROLES) {
    const existingRole = currentRoles.find((r: any) => r.name === roleDef.name)

    if (existingRole) {
      console.log(`[OK] Role "${roleDef.name}" already exists.`)
    } else {
      console.log(`[CREATE] Creating role "${roleDef.name}"...`)
      try {
        await fetchJson(`${LOGTO_ENDPOINT}/api/roles`, token, {
          method: 'POST',
          body: JSON.stringify({
            name: roleDef.name,
            description: roleDef.description,
            type: 'User',
          }),
        })
        console.log(`  -> Success.`)
      } catch (e: any) {
        console.error(`  -> Failed: ${e.message}`)
      }
    }
  }
}

// Step 2: Sync Connectors (Email via Mailgun)
async function syncConnectors(token: string) {
  console.log('\n--- Syncing Connectors ---')

  // Mailgun Email Connector Configuration
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN
  const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.log('[SKIP] Mailgun credentials not found in environment.')
    console.log('  -> Set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env to enable email connector.')
    return
  }

  // Get current connectors
  const currentConnectors: any[] = await fetchJson(`${LOGTO_ENDPOINT}/api/connectors`, token)

  // Find existing Mailgun connector
  const existingMailgun = currentConnectors.find(
    (c: any) => c.connectorId === 'mailgun-email' || c.id?.includes('mailgun')
  )

  const mailgunConfig = {
    endpoint: `https://api.mailgun.net`,
    domain: MAILGUN_DOMAIN,
    apiKey: MAILGUN_API_KEY,
    from: MAILGUN_FROM_EMAIL,
    deliveries: {
      SignIn: {
        subject: 'Fire sign-in verification {{code}}',
        html: 'Your Fire sign-in verification code is {{code}}. The code will remain active for 10 minutes.',
      },
      Register: {
        subject: 'Fire sign-up verification {{code}}',
        html: 'Your Fire sign-up verification code is {{code}}. The code will remain active for 10 minutes.',
      },
      ForgotPassword: {
        subject: 'Fire password reset {{code}}',
        html: 'Your Fire password reset verification code is {{code}}. The code will remain active for 10 minutes.',
      },
      Generic: {
        subject: 'Fire verification {{code}}',
        html: 'Your Fire verification code is {{code}}. The code will remain active for 10 minutes.',
      },
    },
  }

  if (existingMailgun) {
    console.log(
      `[UPDATE] Mailgun connector found (ID: ${existingMailgun.id}). Updating configuration...`
    )
    try {
      await fetchJson(`${LOGTO_ENDPOINT}/api/connectors/${existingMailgun.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ config: mailgunConfig }),
      })
      console.log('  -> Updated Mailgun configuration.')
    } catch (e: any) {
      console.error(`  -> Failed to update: ${e.message}`)
    }
  } else {
    console.log('[CREATE] Creating Mailgun email connector...')
    try {
      // First, get available connector factories
      const factories: any[] = await fetchJson(`${LOGTO_ENDPOINT}/api/connector-factories`, token)
      const mailgunFactory = factories.find((f: any) => f.id === 'mailgun-email')

      if (!mailgunFactory) {
        console.log('  -> Mailgun connector factory not available in this Logto instance.')
        console.log(
          '  -> Available email connectors:',
          factories
            .filter((f: any) => f.type === 'Email')
            .map((f: any) => f.id)
            .join(', ')
        )
        return
      }

      await fetchJson(`${LOGTO_ENDPOINT}/api/connectors`, token, {
        method: 'POST',
        body: JSON.stringify({
          connectorId: 'mailgun-email',
          config: mailgunConfig,
        }),
      })
      console.log('✅ Mailgun email connector created and configured.')
    } catch (e: any) {
      console.error(`  -> Failed to create: ${e.message}`)
    }
  }
}

// Step 3: Sync Applications
async function syncApplications(token: string) {
  console.log('\n--- Syncing Applications ---')

  const APP_NAME = 'Fire'
  const APP_CONFIG = {
    name: APP_NAME,
    type: 'TraditionalWebApp',
    redirectUris: [`${BASE_APP_URL}/api/auth/callback/logto`],
    postLogoutRedirectUris: [`${BASE_APP_URL}`],
    corsAllowedOrigins: [BASE_APP_URL],
  }

  const currentApps: any[] = await fetchJson(`${LOGTO_ENDPOINT}/api/applications`, token)
  const existingApp = currentApps.find((a: any) => a.name === APP_NAME)

  if (existingApp) {
    console.log(
      `[UPDATE] Application "${APP_NAME}" found (ID: ${existingApp.id}). Updating configuration...`
    )
    try {
      await fetchJson(`${LOGTO_ENDPOINT}/api/applications/${existingApp.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          redirectUris: APP_CONFIG.redirectUris,
          postLogoutRedirectUris: APP_CONFIG.postLogoutRedirectUris,
          corsAllowedOrigins: APP_CONFIG.corsAllowedOrigins,
        }),
      })
      console.log(`  -> Updated Redirect URIs to: ${APP_CONFIG.redirectUris.join(', ')}`)
      console.log(`  -> Updated CORS Origins to: ${APP_CONFIG.corsAllowedOrigins.join(', ')}`)
    } catch (e: any) {
      console.error(`  -> Failed to update: ${e.message}`)
    }
  } else {
    console.log(`[CREATE] Application "${APP_NAME}" missing. Creating...`)
    try {
      const createdApp: any = await fetchJson(`${LOGTO_ENDPOINT}/api/applications`, token, {
        method: 'POST',
        body: JSON.stringify(APP_CONFIG),
      })
      console.log(`  -> Success. Created App ID: ${createdApp.id}`)
      console.log(`  -> IMPORTANT: App Secret: ${createdApp.secret}`)
      console.log(`  -> Please update your .env file with these credentials if needed.`)
    } catch (e: any) {
      console.error(`  -> Failed to create: ${e.message}`)
    }
  }
}

// Step 3: Sync Sign-in Experience
async function syncSignInExperience(token: string) {
  console.log('\n--- Syncing Sign-in Experience ---')

  // Configure sign-in experience to use Email + Password (not Username)
  const signInExperienceConfig = {
    // Sign-up settings: only email, with password required
    signUp: {
      identifiers: ['email'],
      password: true,
      verify: true,
    },
    // Sign-in settings: email with password
    signIn: {
      methods: [
        {
          identifier: 'email',
          password: true,
          verificationCode: true,
          isPasswordPrimary: true,
        },
      ],
    },
    // Disable single sign-on by default (can be enabled manually if needed)
    singleSignOnEnabled: false,
  }

  try {
    await fetchJson(`${LOGTO_ENDPOINT}/api/sign-in-exp`, token, {
      method: 'PATCH',
      body: JSON.stringify(signInExperienceConfig),
    })
    console.log('✅ Enforced Email + Password login')
    console.log('  -> Sign-up: Email only (with verification)')
    console.log('  -> Sign-in: Email + Password (verification code as fallback)')
    console.log('  -> Username login: Disabled')
  } catch (e: any) {
    console.error(`  -> Failed to update Sign-in Experience: ${e.message}`)
  }
}

async function main() {
  console.log(`Starting Master Provisioner for target: ${TARGET!.toUpperCase()}`)
  console.log(`Base App URL: ${BASE_APP_URL}`)

  try {
    const token = await getAccessToken()
    console.log('Authenticated successfully.')

    await syncRoles(token)
    await syncConnectors(token)
    await syncApplications(token)
    await syncSignInExperience(token)

    console.log('\nMaster Provisioning Completed.')
  } catch (error: any) {
    console.error('Fatal Error:', error.message)
    process.exit(1)
  }
}

main()
