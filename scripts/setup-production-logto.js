/**
 * Setup Production LogTo via Management API
 *
 * This script:
 * 1. Creates Fire application with correct redirect URIs
 * 2. Applies Fire branding
 * 3. Configures sign-in experience
 *
 * Usage: node scripts/setup-production-logto.js
 */

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'https://auth.lemonade.art'
const APP_URL = process.env.APP_URL || 'https://fire.lemonade.art'

// You'll get these from LogTo Admin → Applications → Management API (create M2M app)
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID || '<FILL_IN_FROM_LOGTO_ADMIN>'
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET || '<FILL_IN_FROM_LOGTO_ADMIN>'

async function setupProductionLogTo() {
  console.log('🚀 Setting up Production LogTo...\n')

  // Step 1: Get Management API access token
  console.log('1️⃣  Getting Management API access token...')
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
    throw new Error(`Failed to get token: ${await tokenResponse.text()}`)
  }

  const { access_token } = await tokenResponse.json()
  console.log('✅ Access token obtained\n')

  // Step 2: Create Fire application
  console.log('2️⃣  Creating Fire application...')
  const appResponse = await fetch(`${LOGTO_ENDPOINT}/api/applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Fire',
      type: 'Traditional',
      description: 'Fire Community Platform',
      oidcClientMetadata: {
        redirectUris: [`${APP_URL}/api/auth/callback/logto`],
        postLogoutRedirectUris: [APP_URL],
        corsAllowedOrigins: [APP_URL],
      },
      customClientMetadata: {
        idTokenTtl: 3600,
        refreshTokenTtl: 1209600,
      },
    }),
  })

  if (!appResponse.ok) {
    throw new Error(`Failed to create app: ${await appResponse.text()}`)
  }

  const app = await appResponse.json()
  console.log('✅ Fire application created!')
  console.log(`   App ID: ${app.id}`)
  console.log(`   App Secret: ${app.secret}\n`)

  // Save credentials for later
  const credentials = {
    LOGTO_APP_ID: app.id,
    LOGTO_APP_SECRET: app.secret,
  }

  // Step 3: Apply Fire branding
  console.log('3️⃣  Applying Fire branding...')

  const customCss = `
    /* Hide LogTo branding */
    footer,
    [class*="footer"],
    [class*="Footer"],
    [class*="poweredBy"],
    [class*="PoweredBy"],
    a[href*="logto.io"],
    a[href*="logto"],
    img[alt*="Logto"],
    img[src*="logto"] {
      display: none !important;
      visibility: hidden !important;
    }
    
    /* Hide logo image */
    header img,
    [class*="logo"] img,
    [class*="Logo"] img {
      display: none !important;
    }
    
    /* Replace with Fire text */
    [class*="logo"]::before,
    [class*="Logo"]::before {
      content: "Fire" !important;
      font-size: 24px !important;
      font-weight: 600 !important;
      color: #111827 !important;
      display: block !important;
    }
    
    /* Fire grayscale colors */
    :root {
      --color-primary: #111827 !important;
    }
    
    button[type="submit"],
    button[class*="primary"],
    button[class*="Primary"] {
      background-color: #111827 !important;
      border-color: #111827 !important;
    }
    
    button[type="submit"]:hover,
    button[class*="primary"]:hover {
      background-color: #1f2937 !important;
    }
    
    a {
      color: #111827 !important;
    }
    
    input:focus,
    button:focus {
      outline-color: #111827 !important;
      border-color: #111827 !important;
    }
  `

  const brandingResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      color: {
        primaryColor: '#111827',
        isDarkModeEnabled: false,
        darkPrimaryColor: '#1f2937',
      },
      customCss: customCss,
    }),
  })

  if (!brandingResponse.ok) {
    console.warn('⚠️  Branding update failed:', await brandingResponse.text())
  } else {
    console.log('✅ Fire branding applied!\n')
  }

  // Step 4: Print summary
  console.log('🎉 Production LogTo Setup Complete!\n')
  console.log('📋 Add these to Vercel Environment Variables:')
  console.log('─'.repeat(50))
  console.log(`LOGTO_APP_ID=${credentials.LOGTO_APP_ID}`)
  console.log(`LOGTO_APP_SECRET=${credentials.LOGTO_APP_SECRET}`)
  console.log(`LOGTO_ISSUER=${LOGTO_ENDPOINT}/oidc`)
  console.log(`LOGTO_ENDPOINT=${LOGTO_ENDPOINT}`)
  console.log('─'.repeat(50))
  console.log('\n✅ Your production LogTo is ready!')
  console.log(`   Visit: ${LOGTO_ENDPOINT}`)
  console.log(`   Login pages will show Fire branding\n`)

  return credentials
}

// Run the setup
setupProductionLogTo()
  .then(() => {
    console.log('✨ All done! Add the environment variables to Vercel and redeploy.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  })
