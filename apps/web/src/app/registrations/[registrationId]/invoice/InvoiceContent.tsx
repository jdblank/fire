'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/date-utils'
import { ApplyDiscountForm } from './ApplyDiscountForm'

interface InvoiceContentProps {
  registrationId: string
  isAdmin: boolean
}

export function InvoiceContent({ registrationId, isAdmin }: InvoiceContentProps) {
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegistration()
  }, [])

  const fetchRegistration = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/registrations/${registrationId}`)
      if (response.ok) {
        const data = await response.json()
        setRegistration(data.registration)
      }
    } catch (error) {
      console.error('Error fetching registration:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDiscount = async (discountId: string, discountName: string) => {
    if (!confirm(`Remove discount "${discountName}"?`)) return

    try {
      const response = await fetch(
        `/api/registrations/${registrationId}/discounts?discountId=${discountId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        alert('Discount removed')
        fetchRegistration() // Refresh
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing discount:', error)
      alert('Failed to remove discount')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading invoice...</div>
  }

  if (!registration) {
    return <div className="text-center py-8 text-red-500">Registration not found</div>
  }

  // Calculate subtotal (before discounts)
  const subtotal = registration.lineItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.calculatedAmount.toString()),
    0
  )

  return (
    <>
      {/* Invoice Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Registration Invoice</h1>
            <p className="text-sm text-gray-500">
              Invoice #{registration.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Registration Date</p>
            <p className="font-medium text-gray-900">{formatDateShort(registration.createdAt)}</p>
          </div>
        </div>

        {/* Event Info */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Event Details</h2>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{registration.event.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              📅{' '}
              {formatDateShort(
                registration.event.startDate,
                registration.event.timezone || undefined
              )}
            </p>
            {registration.event.location && <p>📍 {registration.event.location}</p>}
          </div>
        </div>

        {/* Attendee Info */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Attendee Information</h2>
          <div className="text-sm">
            <p className="text-gray-900 font-medium">
              {registration.user.displayName ||
                `${registration.user.firstName} ${registration.user.lastName}`.trim() ||
                registration.user.email}
            </p>
            <p className="text-gray-600">{registration.user.email}</p>
            {registration.user.mobilePhone && (
              <p className="text-gray-600">{registration.user.mobilePhone}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left text-sm font-medium text-gray-700 pb-2">Description</th>
                <th className="text-right text-sm font-medium text-gray-700 pb-2">Qty</th>
                <th className="text-right text-sm font-medium text-gray-700 pb-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registration.lineItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.lineItem.name}</p>
                      {item.lineItem.description && (
                        <p className="text-xs text-gray-500">{item.lineItem.description}</p>
                      )}
                      {item.userAge && (
                        <p className="text-xs text-gray-500">Age-based ({item.userAge} years)</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(parseFloat(item.calculatedAmount.toString()))}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2">
                <td colSpan={2} className="py-2 text-sm font-medium text-gray-700">
                  Subtotal:
                </td>
                <td className="py-2 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Discounts */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Discounts</h2>
          </div>

          {registration.discounts.length > 0 ? (
            <table className="w-full mb-4">
              <tbody className="divide-y divide-gray-100">
                {registration.discounts.map((discount: any) => (
                  <tr key={discount.id}>
                    <td className="py-2 text-sm text-gray-900">{discount.name}</td>
                    <td className="py-2 text-right text-sm text-green-600 font-medium">
                      -{formatCurrency(parseFloat(discount.amount.toString()))}
                    </td>
                    {isAdmin && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleRemoveDiscount(discount.id, discount.name)}
                          className="text-xs text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No discounts applied</p>
          )}

          {isAdmin && (
            <ApplyDiscountForm
              registrationId={registrationId}
              subtotal={subtotal}
              onSuccess={fetchRegistration}
            />
          )}
        </div>

        {/* Totals */}
        <div className="space-y-3 pt-4 border-t-2 border-gray-900">
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(parseFloat(registration.totalAmount.toString()))}
            </span>
          </div>

          {parseFloat(registration.depositPaid.toString()) > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deposit Paid:</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(parseFloat(registration.depositPaid.toString()))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Balance Due:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(parseFloat(registration.balanceDue.toString()))}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment Status */}
        <div className="mt-6">
          {registration.paymentStatus === 'UNPAID' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Payment Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                {registration.event.requiresDeposit && registration.event.depositAmount
                  ? `Please pay the deposit of ${formatCurrency(parseFloat(registration.event.depositAmount.toString()))} to confirm your registration`
                  : 'Payment information will be provided'}
              </p>
            </div>
          )}
          {registration.paymentStatus === 'DEPOSIT_PAID' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">Deposit Paid</p>
              <p className="text-sm text-blue-700 mt-1">
                Balance of {formatCurrency(parseFloat(registration.balanceDue.toString()))} due
                before event
              </p>
            </div>
          )}
          {registration.paymentStatus === 'FULLY_PAID' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ Fully Paid</p>
              <p className="text-sm text-green-700 mt-1">Your registration is complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/events"
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-block text-center"
        >
          Back to Events
        </Link>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Print Invoice
        </button>
      </div>
    </>
  )
}
