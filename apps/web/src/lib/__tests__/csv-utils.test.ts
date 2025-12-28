import { describe, it, expect } from 'vitest'
import { parseUsersCSV, generateCSVTemplate } from '../csv-utils'

describe('CSV Utils', () => {
  describe('parseUsersCSV', () => {
    it('should parse valid CSV with required fields', () => {
      const csv = `firstName,lastName,email
John,Doe,john@example.com
Jane,Smith,jane@example.com`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.valid[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      })
    })

    it('should parse CSV with optional fields', () => {
      const csv = `firstName,lastName,email,hometown,dateOfBirth,referredByEmail,mobilePhone
John,Doe,john@example.com,Austin TX,1990-01-15,referrer@example.com,+1-555-1234`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hometown: 'Austin TX',
        dateOfBirth: '1990-01-15',
        referredByEmail: 'referrer@example.com',
        mobilePhone: '+1-555-1234',
      })
    })

    it('should reject rows with missing firstName', () => {
      const csv = `firstName,lastName,email
,Doe,john@example.com`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('firstName is required')
    })

    it('should reject rows with missing lastName', () => {
      const csv = `firstName,lastName,email
John,,john@example.com`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('lastName is required')
    })

    it('should reject rows with missing email', () => {
      const csv = `firstName,lastName,email
John,Doe,`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('email is required')
    })

    it('should reject invalid email format', () => {
      const csv = `firstName,lastName,email
John,Doe,invalid-email`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Invalid email format')
    })

    it('should reject invalid date format', () => {
      const csv = `firstName,lastName,email,dateOfBirth
John,Doe,john@example.com,invalid-date`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Invalid date format')
    })

    it('should trim whitespace from fields', () => {
      const csv = `firstName,lastName,email
  John  , Doe ,  john@example.com  `

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0].firstName).toBe('John')
      expect(result.valid[0].lastName).toBe('Doe')
      expect(result.valid[0].email).toBe('john@example.com')
    })

    it('should lowercase email addresses', () => {
      const csv = `firstName,lastName,email
John,Doe,JOHN@EXAMPLE.COM`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0].email).toBe('john@example.com')
    })

    it('should handle mix of valid and invalid rows', () => {
      const csv = `firstName,lastName,email
John,Doe,john@example.com
Jane,,jane@example.com
Bob,Smith,bob@example.com`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(2)
      expect(result.errors).toHaveLength(1)
    })

    it('should skip empty lines', () => {
      const csv = `firstName,lastName,email
John,Doe,john@example.com

Jane,Smith,jane@example.com`

      const result = parseUsersCSV(csv)

      expect(result.valid).toHaveLength(2)
    })
  })

  describe('generateCSVTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = generateCSVTemplate()

      expect(template).toContain('firstName,lastName,email')
      expect(template).toContain('John,Doe,john.doe@example.com')
    })

    it('should include all columns', () => {
      const template = generateCSVTemplate()

      expect(template).toContain('hometown')
      expect(template).toContain('dateOfBirth')
      expect(template).toContain('referredByEmail')
      expect(template).toContain('mobilePhone')
    })
  })
})
