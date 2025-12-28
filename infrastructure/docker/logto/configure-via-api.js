#!/usr/bin/env node
/**
 * LogTo Configuration via Management API
 * Runs in Docker to automatically configure LogTo on first setup
 */

const http = require('http')
const https = require('https')

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001'
const MAX_RETRIES = 30

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'))
          } catch {
            resolve(data)
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

// Wait for LogTo to be ready
async function waitForLogTo() {
  console.log('⏳ Waiting for LogTo to be ready...')

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await makeRequest(`${LOGTO_ENDPOINT}/api/status`)
      console.log('✅ LogTo is ready!\n')
      return true
    } catch (err) {
      process.stdout.write(`   Attempt ${i + 1}/${MAX_RETRIES}...\r`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  throw new Error('LogTo failed to start within timeout')
}

async function main() {
  console.log('🔥 LogTo API Configuration Tool')
  console.log('================================\n')

  try {
    await waitForLogTo()

    console.log('📋 LogTo is running!')
    console.log('')
    console.log('🔗 Access URLs:')
    console.log(`   Admin Console: http://localhost:3002`)
    console.log(`   API Endpoint:  http://localhost:3001`)
    console.log('')
    console.log('📝 Next Steps:')
    console.log('   1. Visit http://localhost:3002 to create your admin account')
    console.log('   2. Create a Machine-to-Machine (M2M) application')
    console.log('   3. Create an API resource for your Fire Platform')
    console.log('   4. Assign Management API permissions to your M2M app')
    console.log('')
    console.log('💡 Tip: Once you have your M2M credentials, add them to:')
    console.log('   docker-compose.yml under the app service:')
    console.log('     LOGTO_APP_ID=<your-app-id>')
    console.log('     LOGTO_APP_SECRET=<your-app-secret>')
    console.log('')
    console.log('✅ LogTo is ready for configuration!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
