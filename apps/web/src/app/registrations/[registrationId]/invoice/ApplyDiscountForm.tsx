'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/pricing'

interface ApplyDiscountFormProps {
  registrationId: string
  subtotal: number
  onSuccess: () => void
}

export function ApplyDiscountForm({ registrationId, subtotal, onSuccess }: ApplyDiscountFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [discountType, setDiscountType] = useState<'FIXED_AMOUNT' | 'PERCENTAGE'>('FIXED_AMOUNT')
  const [amount, setAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!name || !amount) {
        alert('Name and amount are required')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/registrations/${registrationId}/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          discountType,
          amount: parseFloat(amount),
        }),
      })

      if (response.ok) {
        alert('Discount applied successfully!')
        setShowForm(false)
        setName('')
        setAmount('')
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error applying discount:', error)
      alert('Failed to apply discount')
    } finally {
      setLoading(false)
    }
  }

  const previewAmount = () => {
    if (!amount) return 0
    if (discountType === 'FIXED_AMOUNT') {
      return parseFloat(amount)
    } else {
      return subtotal * (parseFloat(amount) / 100)
    }
  }

  return (
    <div className="mt-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-blue-600 hover:text-blue-900"
        >
          + Apply Discount
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <h4 className="font-medium text-gray-900 text-sm">Apply Discount</h4>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discount Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="e.g., Early Bird, Family Discount"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {discountType === 'FIXED_AMOUNT' ? 'Amount ($)' : 'Percentage (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={discountType === 'FIXED_AMOUNT' ? '100.00' : '10'}
              />
            </div>
          </div>

          {amount && (
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
              Discount amount: <span className="font-medium text-blue-900">{formatCurrency(previewAmount())}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Applying...' : 'Apply Discount'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setName('')
                setAmount('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

