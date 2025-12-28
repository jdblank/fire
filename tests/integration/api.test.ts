import { describe, it, expect } from 'vitest'

describe('API Routes', () => {
  // Detect if we're running inside Docker by checking if DATABASE_URL uses docker service names
  const isInDocker = process.env.DATABASE_URL?.includes('postgres:5432') ?? false
  const APP_HOST = isInDocker ? 'app' : 'localhost'
  // Only use BASE_URL env var if it's a complete URL (starts with http)
  const envUrl = process.env.BASE_URL?.trim()
  const BASE_URL = envUrl && envUrl.startsWith('http') ? envUrl : `http://${APP_HOST}:3000`

  console.log(
    `Running API tests against: ${BASE_URL} (isInDocker: ${isInDocker}, APP_HOST: ${APP_HOST})`
  )

  describe('Health Check Endpoint', () => {
    it('should return 200 status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.status).toBe(200)
    })

    it('should return JSON with status healthy', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      const data = await response.json()

      expect(data).toHaveProperty('status', 'healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('services')
      expect(data.services).toHaveProperty('app', 'ok')
      expect(data.services).toHaveProperty('database', 'ok')
    })
  })

  describe('Home Page', () => {
    it('should be accessible', async () => {
      const response = await fetch(BASE_URL)
      expect(response.ok).toBe(true)
    })

    it('should contain Fire title', async () => {
      const response = await fetch(BASE_URL)
      const html = await response.text()
      expect(html).toContain('Fire')
    })
  })

  describe('Posts API', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/posts`)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    // Note: Full posts API test would require setting up auth session
    // This is a placeholder to ensure the endpoint exists and validates auth
  })
})
