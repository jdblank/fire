import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatCurrency } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toMatch(/January 15, 2024/)
    })
  })

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('should format other currencies', () => {
      expect(formatCurrency(100, 'EUR')).toMatch(/100/)
    })
  })
})


