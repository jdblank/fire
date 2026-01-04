'use client'

import { useState, useEffect } from 'react'
import { calculateAge, calculateLineItemAmount, formatCurrency } from '@/lib/pricing'

interface Event {
  id: string
  title: string
  startDate: string
  eventType: string
  status: string
}

interface User {
  id: string
  dateOfBirth: Date | null
}

interface RegisterUserFormProps {
  user: User
}

export function RegisterUserForm({ user }: RegisterUserFormProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set())
  const [calculatedAmounts, setCalculatedAmounts] = useState<Map<string, number>>(new Map())
  const [totalAmount, setTotalAmount] = useState(0)
  const [depositPaid, setDepositPaid] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')
  const [note, setNote] = useState('')
  const [eventLineItems, setEventLineItems] = useState<any[]>([])
  const [userAge, setUserAge] = useState<number | null>(null)

  // Calculate user's age at the time of the selected event
  useEffect(() => {
    if (user.dateOfBirth && selectedEventId) {
      const selectedEvent = events.find((e) => e.id === selectedEventId)
      if (selectedEvent) {
        const age = calculateAge(user.dateOfBirth, selectedEvent.startDate)
        setUserAge(age)
      }
    }
  }, [user.dateOfBirth, selectedEventId, events])

  // Fetch all events (including completed)
  useEffect(() => {
    fetchEvents()
  }, [])

  // Fetch line items when event selected
  useEffect(() => {
    if (selectedEventId) {
      fetchLineItems()
    } else {
      setEventLineItems([])
      setSelectedLineItems(new Set())
    }
  }, [selectedEventId])

  // Recalculate when selections change
  useEffect(() => {
    if (eventLineItems.length === 0) return

    const amounts = new Map<string, number>()
    let total = 0

    eventLineItems.forEach((item) => {
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
  }, [selectedLineItems, eventLineItems, userAge])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchLineItems = async () => {
    try {
      const response = await fetch(`/api/admin/events/${selectedEventId}/line-items`)
      if (response.ok) {
        const data = await response.json()
        setEventLineItems(data.lineItems)

        // Auto-select required items
        const required = new Set<string>()
        data.lineItems.forEach((item: any) => {
          if (item.isRequired) {
            required.add(item.id)
          }
        })
        setSelectedLineItems(required)
      }
    } catch (error) {
      console.error('Error fetching line items:', error)
    }
  }

  const toggleLineItem = (itemId: string) => {
    const item = eventLineItems.find((i) => i.id === itemId)
    if (item?.isRequired) return

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
      if (!selectedEventId) {
        alert('Please select an event')
        setLoading(false)
        return
      }

      const lineItemsData = Array.from(selectedLineItems).map((itemId) => {
        const item = eventLineItems.find((i) => i.id === itemId)!
        return {
          lineItemId: itemId,
          quantity: 1,
          calculatedAmount: calculatedAmounts.get(itemId) || 0,
          userAge: item.lineItemType === 'AGE_BASED' ? userAge : null,
        }
      })

      const response = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          userId: user.id,
          lineItems: lineItemsData,
          totalAmount,
          depositPaid: depositPaid ? parseFloat(depositPaid) : 0,
          paymentStatus,
          adminOverride: true,
          overrideNote: note || 'Registered by admin',
        }),
      })

      if (response.ok) {
        alert('User registered for event successfully!')
        setSelectedEventId('')
        setSelectedLineItems(new Set())
        setDepositPaid('')
        setPaymentStatus('UNPAID')
        setNote('')
        // Refresh the page to show new registration
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Register User for Event</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Choose an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} ({event.status}) - {new Date(event.startDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {/* Line Items Selection */}
        {eventLineItems.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Line Items</label>
            {eventLineItems.map((item) => {
              const isSelected = selectedLineItems.has(item.id)
              const amount = calculatedAmounts.get(item.id) || 0

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 ${
                    item.isRequired
                      ? 'border-gray-300 bg-gray-50'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => !item.isRequired && toggleLineItem(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!item.isRequired && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLineItem(item.id)}
                          className="w-4 h-4"
                        />
                      )}
                      <div>
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.isRequired && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(amount)}</span>
                  </div>
                </div>
              )
            })}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        {selectedEventId && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Paid ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="DEPOSIT_PAID">Deposit Paid</option>
                  <option value="FULLY_PAID">Fully Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Optional notes about this registration..."
              />
            </div>
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !selectedEventId}
          className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register User for Event'}
        </button>
      </form>
    </div>
  )
}
