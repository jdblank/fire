'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateAge, calculateLineItemAmount, formatCurrency } from '@/lib/pricing'

interface LineItem {
  id: string
  name: string
  description: string | null
  lineItemType: string
  isRequired: boolean
  calculationMethod: string
  baseAmount: string | null
  minAmount: string | null
  maxAmount: string | null
  multiplier: string | null
}

interface Event {
  id: string
  title: string
  eventType: string
  requiresDeposit: boolean
  depositAmount: string | null
  currency: string
  lineItems: LineItem[]
}

interface User {
  id: string
  email?: string | null
  dateOfBirth?: string | null
}

interface RegisterFormProps {
  event: Event
  user: User
}

export function RegisterForm({ event, user }: RegisterFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set())
  const [calculatedAmounts, setCalculatedAmounts] = useState<Map<string, number>>(new Map())
  const [totalAmount, setTotalAmount] = useState(0)
  const [userAge, setUserAge] = useState<number | null>(null)

  // Calculate user's age at the time of the event
  useEffect(() => {
    if (user.dateOfBirth) {
      const age = calculateAge(user.dateOfBirth, event.startDate)
      setUserAge(age)
    }
  }, [user.dateOfBirth, event.startDate])

  // Auto-select required line items
  useEffect(() => {
    const required = new Set<string>()
    event.lineItems.forEach((item) => {
      if (item.isRequired) {
        required.add(item.id)
      }
    })
    setSelectedLineItems(required)
  }, [event.lineItems])

  // Recalculate amounts when selections change
  useEffect(() => {
    const amounts = new Map<string, number>()
    let total = 0

    event.lineItems.forEach((item) => {
      if (selectedLineItems.has(item.id)) {
        try {
          const amount = calculateLineItemAmount(item, userAge || undefined)
          amounts.set(item.id, amount)
          total += amount
        } catch (error) {
          console.error(`Error calculating ${item.name}:`, error)
        }
      }
    })

    setCalculatedAmounts(amounts)
    setTotalAmount(total)
  }, [selectedLineItems, event.lineItems, userAge])

  const toggleLineItem = (itemId: string) => {
    const item = event.lineItems.find((i) => i.id === itemId)
    if (item?.isRequired) return // Can't deselect required items

    const newSelected = new Set(selectedLineItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedLineItems(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if user has date of birth for age-based items
      const hasAgeBased = event.lineItems.some(
        (item) => item.lineItemType === 'AGE_BASED' && selectedLineItems.has(item.id)
      )

      if (hasAgeBased && !userAge) {
        alert('Please update your profile with your date of birth to register for this event')
        setLoading(false)
        return
      }

      // Prepare line items data
      const lineItemsData = Array.from(selectedLineItems).map((itemId) => {
        const item = event.lineItems.find((i) => i.id === itemId)!
        return {
          lineItemId: itemId,
          quantity: 1,
          calculatedAmount: calculatedAmounts.get(itemId) || 0,
          userAge: item.lineItemType === 'AGE_BASED' ? userAge : null,
        }
      })

      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: lineItemsData,
          totalAmount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('Registration successful!')
        router.push(`/registrations/${data.registration.id}/invoice`)
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Registration failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Register for This Event</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Line Items Selection - Only show for PAID events or if there are non-zero items */}
        {event.eventType === 'PAID' && event.lineItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Registration Options</h3>

            {event.lineItems.map((item) => {
              const isSelected = selectedLineItems.has(item.id)
              const amount = calculatedAmounts.get(item.id) || 0

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.isRequired
                      ? 'border-gray-300 bg-gray-50'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => !item.isRequired && toggleLineItem(item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {!item.isRequired && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLineItem(item.id)}
                          className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.isRequired && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        {item.lineItemType === 'AGE_BASED' && userAge && (
                          <p className="text-xs text-gray-500 mt-1">
                            Calculated based on your age: {userAge} years
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Total - Only show for PAID events */}
        {event.eventType === 'PAID' && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>

            {event.requiresDeposit && event.depositAmount && (
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  Deposit required: {formatCurrency(parseFloat(event.depositAmount.toString()))}
                </p>
                <p className="text-xs mt-1">
                  Balance of{' '}
                  {formatCurrency(totalAmount - parseFloat(event.depositAmount.toString()))} due
                  later
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading || (event.eventType === 'PAID' && totalAmount === 0)}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Processing...'
              : event.eventType === 'FREE'
                ? 'Register for Free Event'
                : event.requiresDeposit
                  ? 'Register & Pay Deposit'
                  : 'Complete Registration'}
          </button>
          {totalAmount === 0 && event.eventType === 'PAID' && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please select at least one option to register
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
