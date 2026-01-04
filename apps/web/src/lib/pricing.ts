/**
 * Pricing Calculation Utilities
 * Handles complex event pricing including age-based dues, line items, and discounts
 */

interface LineItem {
  id: string
  name: string
  lineItemType: string
  calculationMethod: string
  baseAmount: string | number | null
  minAmount: string | number | null
  maxAmount: string | number | null
  multiplier: string | number | null
  isRequired: boolean
}

interface CalculatedLineItem {
  lineItemId: string
  name: string
  quantity: number
  amount: number
  userAge?: number
}

interface Discount {
  name: string
  discountType: string
  amount: number
}

/**
 * Calculate age from date of birth at a specific date
 * @param dateOfBirth - User's date of birth
 * @param atDate - Date to calculate age at (defaults to today)
 */
export function calculateAge(dateOfBirth: Date | string, atDate?: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const referenceDate = atDate
    ? typeof atDate === 'string'
      ? new Date(atDate)
      : atDate
    : new Date()

  let age = referenceDate.getFullYear() - dob.getFullYear()
  const monthDiff = referenceDate.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--
  }

  return age
}

/**
 * Calculate line item amount based on configuration
 */
export function calculateLineItemAmount(
  lineItem: LineItem,
  userAge?: number,
  quantity: number = 1
): number {
  const { calculationMethod, baseAmount, minAmount, maxAmount, multiplier } = lineItem

  let amount = 0

  switch (calculationMethod) {
    case 'FIXED_AMOUNT':
      amount = parseFloat(baseAmount?.toString() || '0')
      break

    case 'AGE_MULTIPLIER':
      if (!userAge) {
        throw new Error('User age required for age-based pricing')
      }
      if (!multiplier) {
        throw new Error('Multiplier required for age-based pricing')
      }

      // Calculate: age × multiplier
      amount = userAge * parseFloat(multiplier.toString())

      // Apply min/max constraints
      if (minAmount) {
        amount = Math.max(amount, parseFloat(minAmount.toString()))
      }
      if (maxAmount) {
        amount = Math.min(amount, parseFloat(maxAmount.toString()))
      }
      break

    case 'PERCENTAGE':
      // Percentage calculations are applied after subtotal
      // This is just the percentage value, not the calculated amount
      amount = parseFloat(baseAmount?.toString() || '0')
      break

    default:
      amount = parseFloat(baseAmount?.toString() || '0')
  }

  return amount * quantity
}

/**
 * Calculate total registration cost
 */
export function calculateRegistrationTotal(
  lineItems: CalculatedLineItem[],
  discounts: Discount[] = []
): {
  subtotal: number
  discountTotal: number
  total: number
  breakdown: {
    lineItems: { name: string; amount: number }[]
    discounts: { name: string; amount: number }[]
  }
} {
  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)

  // Calculate discount total
  let discountTotal = 0
  const discountBreakdown: { name: string; amount: number }[] = []

  for (const discount of discounts) {
    let discountAmount = 0

    if (discount.discountType === 'FIXED_AMOUNT') {
      discountAmount = discount.amount
    } else if (discount.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (discount.amount / 100)
    }

    discountTotal += discountAmount
    discountBreakdown.push({
      name: discount.name,
      amount: discountAmount,
    })
  }

  // Calculate final total
  const total = Math.max(0, subtotal - discountTotal)

  return {
    subtotal,
    discountTotal,
    total,
    breakdown: {
      lineItems: lineItems.map((item) => ({
        name: item.name,
        amount: item.amount,
      })),
      discounts: discountBreakdown,
    },
  }
}

/**
 * Calculate deposit and balance due
 */
export function calculateDepositAndBalance(
  totalAmount: number,
  depositRequired: number,
  depositPaid: number = 0
): {
  depositDue: number
  balanceDue: number
  isDepositPaid: boolean
  isFullyPaid: boolean
} {
  const depositDue = Math.max(0, depositRequired - depositPaid)
  const balanceDue = Math.max(0, totalAmount - depositPaid)

  return {
    depositDue,
    balanceDue,
    isDepositPaid: depositPaid >= depositRequired,
    isFullyPaid: depositPaid >= totalAmount,
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Get payment status from amounts
 */
export function getPaymentStatus(
  totalAmount: number,
  depositPaid: number
): 'UNPAID' | 'DEPOSIT_PAID' | 'FULLY_PAID' {
  if (depositPaid === 0) return 'UNPAID'
  if (depositPaid >= totalAmount) return 'FULLY_PAID'
  return 'DEPOSIT_PAID'
}
