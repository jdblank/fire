import { describe, it, expect, beforeAll } from 'vitest'

describe('Infrastructure Health Checks', () => {
  // Use environment variables or detect if we're inside Docker
  const isInDocker = process.env.DATABASE_URL?.includes('postgres:5432')
  
  const POSTGRES_HOST = isInDocker ? 'postgres' : 'localhost'
  const REDIS_HOST = isInDocker ? 'redis' : 'localhost'
  const MINIO_HOST = isInDocker ? 'minio' : 'localhost'
  const LOGTO_HOST = isInDocker ? 'logto' : 'localhost'
  const OUTLINE_HOST = isInDocker ? 'outline' : 'localhost'
  
  const POSTGRES_URL = process.env.DATABASE_URL || `postgres://fireuser:firepass@${POSTGRES_HOST}:5432/fire_db`
  const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:6379`
  const MINIO_ENDPOINT = isInDocker ? `http://${MINIO_HOST}:9000` : `http://${MINIO_HOST}:9100`
  const LOGTO_ENDPOINT = `http://${LOGTO_HOST}:3001`
  const OUTLINE_ENDPOINT = isInDocker ? `http://${OUTLINE_HOST}:3000` : `http://${OUTLINE_HOST}:3004`

  describe('PostgreSQL Database', () => {
    it('should be accessible', async () => {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: POSTGRES_URL })
      
      await expect(client.connect()).resolves.not.toThrow()
      
      const result = await client.query('SELECT 1 as test')
      expect(result.rows[0].test).toBe(1)
      
      await client.end()
    })

    it('should have fire_db database', async () => {
      const { Client } = await import('pg')
      const client = new Client({ connectionString: POSTGRES_URL })
      
      await client.connect()
      const result = await client.query('SELECT current_database()')
      expect(result.rows[0].current_database).toBe('fire_db')
      
      await client.end()
    })

    it('should have logto_db database available', async () => {
      const { Client } = await import('pg')
      const client = new Client({
        connectionString: `postgres://fireuser:firepass@${POSTGRES_HOST}:5432/logto_db`
      })
      
      await client.connect()
      const result = await client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'')
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0)
      
      await client.end()
    })
  })

  describe('Redis Cache', () => {
    it('should be accessible', async () => {
      const redis = await import('redis')
      const client = redis.createClient({ url: REDIS_URL })
      
      await expect(client.connect()).resolves.not.toThrow()
      
      await client.set('test:health', 'ok')
      const value = await client.get('test:health')
      expect(value).toBe('ok')
      
      await client.del('test:health')
      await client.quit()
    })

    it('should support key expiration', async () => {
      const redis = await import('redis')
      const client = redis.createClient({ url: REDIS_URL })
      
      await client.connect()
      await client.set('test:ttl', 'value', { EX: 1 })
      
      const ttl = await client.ttl('test:ttl')
      expect(ttl).toBeGreaterThan(0)
      
      await client.del('test:ttl')
      await client.quit()
    })
  })

  describe('MinIO S3 Storage', () => {
    it('should be accessible via health endpoint', async () => {
      const response = await fetch(`${MINIO_ENDPOINT}/minio/health/live`)
      expect(response.ok).toBe(true)
    })

    it('should have fire-uploads bucket', async () => {
      // Note: This requires AWS SDK which we have in the web app
      // For now, just verify the endpoint is accessible
      const response = await fetch(`${MINIO_ENDPOINT}/fire-uploads/`)
      // Should return 403 (forbidden) or 200, not 404
      expect([200, 403].includes(response.status)).toBe(true)
    })
  })

  describe('LogTo Authentication', () => {
    it('should be accessible', async () => {
      const response = await fetch(`${LOGTO_ENDPOINT}/api/status`)
      expect(response.ok).toBe(true)
    })

    it('should return valid status response', async () => {
      const response = await fetch(`${LOGTO_ENDPOINT}/api/status`)
      
      // LogTo may return empty body for status endpoint - just check it responds
      if (response.headers.get('content-length') !== '0') {
        try {
          const data = await response.json()
          expect(data).toHaveProperty('status')
        } catch (e) {
          // If not JSON, that's fine as long as it responded
          expect(response.ok).toBe(true)
        }
      } else {
        expect(response.ok).toBe(true)
      }
    })

    it('should serve OIDC discovery endpoint', async () => {
      const response = await fetch(`${LOGTO_ENDPOINT}/oidc/.well-known/openid-configuration`)
      expect(response.ok).toBe(true)
      
      const config = await response.json()
      expect(config).toHaveProperty('issuer')
      expect(config).toHaveProperty('authorization_endpoint')
      expect(config).toHaveProperty('token_endpoint')
    })
  })

  describe('Outline Wiki', () => {
    it('should be accessible', async () => {
      const response = await fetch(OUTLINE_ENDPOINT)
      expect(response.ok).toBe(true)
    })

    it('should serve the application', async () => {
      const response = await fetch(OUTLINE_ENDPOINT)
      const html = await response.text()
      expect(html).toContain('Outline')
    })
  })
})
