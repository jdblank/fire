import { NextResponse } from 'next/server'

import { auth } from '@/auth'

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET
const MANAGEMENT_API_RESOURCE = 'https://default.logto.app/api'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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

    // Get current sign-in experience
    const getResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    const currentExp = await getResponse.json()

    // Custom CSS to hide "Powered by Logto" and match Fire branding
    const customCss = `
      /* Aggressively hide LogTo branding */
      footer,
      [class*="footer"],
      [class*="Footer"],
      [class*="poweredBy"],
      [class*="PoweredBy"],
      [class*="powered-by"],
      a[href*="logto.io"],
      a[href*="logto"],
      img[alt*="Logto"],
      img[alt*="logto"],
      img[src*="logto"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Hide the logo image completely */
      header img,
      [class*="logo"] img,
      [class*="Logo"] img {
        display: none !important;
      }
      
      /* Replace logo area with "Fire" text */
      [class*="logo"]::before,
      [class*="Logo"]::before {
        content: "Fire" !important;
        font-size: 24px !important;
        font-weight: 600 !important;
        color: #111827 !important;
        display: block !important;
      }
      
      /* Fire grayscale color scheme */
      :root {
        --color-primary: #111827 !important;
      }
      
      /* Primary button styling (gray-900) */
      button[type="submit"],
      button[class*="primary"],
      button[class*="Primary"],
      [class*="Button"][class*="primary"] {
        background-color: #111827 !important;
        border-color: #111827 !important;
      }
      
      button[type="submit"]:hover,
      button[class*="primary"]:hover,
      button[class*="Primary"]:hover {
        background-color: #1f2937 !important;
      }
      
      /* Links and text */
      a {
        color: #111827 !important;
      }
      
      a:hover {
        color: #1f2937 !important;
      }
      
      /* Focus states */
      input:focus,
      button:focus {
        outline-color: #111827 !important;
        border-color: #111827 !important;
      }
    `

    // Update branding
    const updateResponse = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...currentExp,
        // Don't modify branding object - just add colors and CSS
        color: {
          primaryColor: '#111827', // Fire gray-900
          isDarkModeEnabled: false,
          darkPrimaryColor: '#1f2937' // Fire gray-800
        },
        customCss: customCss
      })
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      return NextResponse.json({
        success: false,
        error: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'LogTo branded as Fire successfully!',
      changes: {
        primaryColor: '#111827 (gray-900)',
        removedLogoBranding: true,
        hiddenPoweredBy: true,
        customCss: true
      }
    })

  } catch (error) {
    console.error('Error branding LogTo:', error)
    return NextResponse.json(
      { error: 'Failed to brand LogTo', details: (error as Error).message },
      { status: 500 }
    )
  }
}

