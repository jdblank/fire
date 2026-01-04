import { describe, it, expect } from 'vitest'
import {
  calculateAge,
  calculateLineItemAmount,
  calculateRegistrationTotal,
  calculateDepositAndBalance,
  formatCurrency,
  getPaymentStatus,
} from '../../apps/web/src/lib/pricing'

describe('Pricing Calculations', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const dob = new Date('1990-01-01')
      const age = calculateAge(dob)

      expect(age).toBeGreaterThanOrEqual(34)
      expect(age).toBeLessThanOrEqual(35)
    })

    it('should handle string dates', () => {
      const age = calculateAge('1975-03-03')

      expect(age).toBeGreaterThanOrEqual(49)
      expect(age).toBeLessThanOrEqual(50)
    })

    it('should calculate age at a specific date', () => {
      const dob = new Date('1990-01-15')
      const eventDate = new Date('2025-06-01')
      const age = calculateAge(dob, eventDate)

      expect(age).toBe(35)
    })

    it('should handle birthday not yet reached at event date', () => {
      const dob = new Date('1990-12-31')
      const eventDate = new Date('2025-06-01')
      const age = calculateAge(dob, eventDate)

      expect(age).toBe(34)
    })

    it('should handle string dates for both parameters', () => {
      const age = calculateAge('1990-01-15', '2025-06-01')

      expect(age).toBe(35)
    })
  })

  describe('calculateLineItemAmount', () => {
    it('should calculate fixed amount', () => {
      const lineItem = {
        id: '1',
        name: 'Test',
        lineItemType: 'FIXED',
        calculationMethod: 'FIXED_AMOUNT',
        baseAmount: 250,
        minAmount: null,
        maxAmount: null,
        multiplier: null,
        isRequired: true,
      }

      const amount = calculateLineItemAmount(lineItem, undefined, 1)
      expect(amount).toBe(250)
    })

    it('should calculate age-based amount with multiplier', () => {
      const lineItem = {
        id: '1',
        name: 'Dues',
        lineItemType: 'AGE_BASED',
        calculationMethod: 'AGE_MULTIPLIER',
        baseAmount: null,
        minAmount: 1800,
        maxAmount: 3600,
        multiplier: 60,
        isRequired: true,
      }

      const amount = calculateLineItemAmount(lineItem, 35, 1)
      expect(amount).toBe(2100) // 35 * 60
    })

    it('should enforce minimum amount', () => {
      const lineItem = {
        id: '1',
        name: 'Dues',
        lineItemType: 'AGE_BASED',
        calculationMethod: 'AGE_MULTIPLIER',
        baseAmount: null,
        minAmount: 1800,
        maxAmount: 3600,
        multiplier: 60,
        isRequired: true,
      }

      const amount = calculateLineItemAmount(lineItem, 20, 1) // 20 * 60 = 1200, but min is 1800
      expect(amount).toBe(1800)
    })

    it('should enforce maximum amount', () => {
      const lineItem = {
        id: '1',
        name: 'Dues',
        lineItemType: 'AGE_BASED',
        calculationMethod: 'AGE_MULTIPLIER',
        baseAmount: null,
        minAmount: 1800,
        maxAmount: 3600,
        multiplier: 60,
        isRequired: true,
      }

      const amount = calculateLineItemAmount(lineItem, 70, 1) // 70 * 60 = 4200, but max is 3600
      expect(amount).toBe(3600)
    })

    it('should handle quantity', () => {
      const lineItem = {
        id: '1',
        name: 'Test',
        lineItemType: 'FIXED',
        calculationMethod: 'FIXED_AMOUNT',
        baseAmount: 100,
        minAmount: null,
        maxAmount: null,
        multiplier: null,
        isRequired: false,
      }

      const amount = calculateLineItemAmount(lineItem, undefined, 3)
      expect(amount).toBe(300)
    })
  })

  describe('calculateRegistrationTotal', () => {
    it('should calculate total with line items', () => {
      const lineItems = [
        { lineItemId: '1', name: 'Dues', quantity: 1, amount: 2100 },
        { lineItemId: '2', name: 'RV Supplement', quantity: 1, amount: 550 },
      ]

      const result = calculateRegistrationTotal(lineItems, [])

      expect(result.subtotal).toBe(2650)
      expect(result.total).toBe(2650)
    })

    it('should apply fixed discount', () => {
      const lineItems = [{ lineItemId: '1', name: 'Dues', quantity: 1, amount: 2100 }]

      const discounts = [{ name: 'Early Bird', discountType: 'FIXED_AMOUNT', amount: 200 }]

      const result = calculateRegistrationTotal(lineItems, discounts)

      expect(result.subtotal).toBe(2100)
      expect(result.discountTotal).toBe(200)
      expect(result.total).toBe(1900)
    })

    it('should apply percentage discount', () => {
      const lineItems = [{ lineItemId: '1', name: 'Dues', quantity: 1, amount: 2000 }]

      const discounts = [{ name: '10% Discount', discountType: 'PERCENTAGE', amount: 10 }]

      const result = calculateRegistrationTotal(lineItems, discounts)

      expect(result.subtotal).toBe(2000)
      expect(result.discountTotal).toBe(200) // 10% of 2000
      expect(result.total).toBe(1800)
    })
  })

  describe('calculateDepositAndBalance', () => {
    it('should calculate deposit and balance', () => {
      const result = calculateDepositAndBalance(2100, 500, 0)

      expect(result.depositDue).toBe(500)
      expect(result.balanceDue).toBe(2100)
      expect(result.isDepositPaid).toBe(false)
      expect(result.isFullyPaid).toBe(false)
    })

    it('should recognize deposit paid', () => {
      const result = calculateDepositAndBalance(2100, 500, 500)

      expect(result.depositDue).toBe(0)
      expect(result.balanceDue).toBe(1600)
      expect(result.isDepositPaid).toBe(true)
      expect(result.isFullyPaid).toBe(false)
    })

    it('should recognize fully paid', () => {
      const result = calculateDepositAndBalance(2100, 500, 2100)

      expect(result.depositDue).toBe(0)
      expect(result.balanceDue).toBe(0)
      expect(result.isDepositPaid).toBe(true)
      expect(result.isFullyPaid).toBe(true)
    })
  })

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(2100)).toBe('$2,100.00')
      expect(formatCurrency(550.5)).toBe('$550.50')
    })
  })

  describe('getPaymentStatus', () => {
    it('should return UNPAID when no payment', () => {
      expect(getPaymentStatus(2100, 0)).toBe('UNPAID')
    })

    it('should return DEPOSIT_PAID when partial payment', () => {
      expect(getPaymentStatus(2100, 500)).toBe('DEPOSIT_PAID')
    })

    it('should return FULLY_PAID when paid in full', () => {
      expect(getPaymentStatus(2100, 2100)).toBe('FULLY_PAID')
    })
  })
})
