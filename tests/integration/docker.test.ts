import { describe, it, expect } from 'vitest'

// Instead of checking Docker CLI status, we verify services are healthy by connecting to them
// This works both inside and outside Docker containers
describe('Infrastructure Container Health', () => {
  // Detect if we're running inside Docker by checking environment variables
  const isInDocker = process.env.DATABASE_URL?.includes('postgres:5432')

  const POSTGRES_HOST = isInDocker ? 'postgres' : 'localhost'
  const REDIS_HOST = isInDocker ? 'redis' : 'localhost'
  const MINIO_HOST = isInDocker ? 'minio' : 'localhost'
  const LOGTO_HOST = isInDocker ? 'logto' : 'localhost'
  const OUTLINE_HOST = isInDocker ? 'outline' : 'localhost'

  describe('PostgreSQL Service', () => {
    it('should be running and healthy', async () => {
      const { Client } = await import('pg')
      const client = new Client({
        connectionString: `postgres://fireuser:firepass@${POSTGRES_HOST}:5432/fire_db`,
      })

      await client.connect()
      const result = await client.query('SELECT version()')
      expect(result.rows[0].version).toContain('PostgreSQL')
      await client.end()
    })
  })

  describe('Redis Service', () => {
    it('should be running and healthy', async () => {
      const redis = await import('redis')
      const client = redis.createClient({ url: `redis://${REDIS_HOST}:6379` })

      await client.connect()
      const pong = await client.ping()
      expect(pong).toBe('PONG')
      await client.quit()
    })
  })

  describe('MinIO Service', () => {
    it('should be running and healthy', async () => {
      // MinIO port is 9000 internally, 9100 externally
      const port = isInDocker ? 9000 : 9100
      const response = await fetch(`http://${MINIO_HOST}:${port}/minio/health/live`)
      expect(response.status).toBe(200)
    })
  })

  describe('LogTo Service', () => {
    it('should be running and healthy', async () => {
      const response = await fetch(`http://${LOGTO_HOST}:3001/api/status`)
      expect(response.ok).toBe(true)
    })
  })

  describe('Outline Service', () => {
    it('should be running and healthy', async () => {
      // Outline uses port 3000 internally, 3004 externally
      const port = isInDocker ? 3000 : 3004
      const response = await fetch(`http://${OUTLINE_HOST}:${port}`)
      expect(response.ok).toBe(true)
    })
  })

  describe('Data Persistence', () => {
    it('should persist data in postgres', async () => {
      const { Client } = await import('pg')
      const client = new Client({
        connectionString: `postgres://fireuser:firepass@${POSTGRES_HOST}:5432/fire_db`,
      })

      await client.connect()
      // Create a test table, insert data, verify it persists
      await client.query(
        'CREATE TABLE IF NOT EXISTS health_check (id SERIAL PRIMARY KEY, timestamp TIMESTAMP DEFAULT NOW())'
      )
      await client.query('INSERT INTO health_check DEFAULT VALUES')
      const result = await client.query('SELECT COUNT(*) FROM health_check')
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0)
      await client.query('DROP TABLE health_check')
      await client.end()
    })

    it('should persist data in redis', async () => {
      const redis = await import('redis')
      const client = redis.createClient({ url: `redis://${REDIS_HOST}:6379` })

      await client.connect()
      const testKey = `health_check:${Date.now()}`
      await client.set(testKey, 'persistent_data')
      const value = await client.get(testKey)
      expect(value).toBe('persistent_data')
      await client.del(testKey)
      await client.quit()
    })
  })
})
