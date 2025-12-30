'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { searchCities, type City } from '@/lib/cities'

interface EventFormProps {
  eventId?: string
  initialData?: any
}

export function EventForm({ eventId, initialData }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [citySearch, setCitySearch] = useState(initialData?.location || '')
  const [cityResults, setCityResults] = useState<City[]>([])
  const [showCityResults, setShowCityResults] = useState(false)

  // Helper to format date for input fields
  const formatDateForInput = (date: string | Date | undefined, isAllDay: boolean): string => {
    if (!date) return ''
    const d = new Date(date)
    if (isAllDay) {
      // For date-only input: YYYY-MM-DD
      return d.toISOString().slice(0, 10)
    }
    // For datetime-local input: YYYY-MM-DDTHH:MM
    return d.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    isAllDay: initialData?.isAllDay || false,
    startDate: formatDateForInput(initialData?.startDate, initialData?.isAllDay || false),
    endDate: formatDateForInput(initialData?.endDate, initialData?.isAllDay || false),
    location: initialData?.location || '',
    timezone: initialData?.timezone || 'America/New_York',
    isOnline: initialData?.isOnline || false,
    eventType: initialData?.eventType || 'FREE',
    requiresDeposit: initialData?.requiresDeposit || false,
    depositAmount: initialData?.depositAmount?.toString() || '',
    maxAttendees: initialData?.maxAttendees?.toString() || '',
    status: initialData?.status || 'DRAFT',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleCitySearch = (query: string) => {
    setCitySearch(query)
    setFormData({ ...formData, location: query })

    if (query.length >= 2) {
      const results = searchCities(query)
      setCityResults(results)
      setShowCityResults(true)
    } else {
      setCityResults([])
      setShowCityResults(false)
    }
  }

  const selectCity = (city: City) => {
    setCitySearch(city.displayName)
    setFormData({
      ...formData,
      location: city.displayName,
      timezone: city.timezone,
    })
    setShowCityResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.title) newErrors.title = 'Title is required'
      if (!formData.startDate) newErrors.startDate = 'Start date is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setLoading(false)
        return
      }

      // Prepare data
      const data = {
        title: formData.title,
        description: formData.description,
        isAllDay: formData.isAllDay,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        location: formData.location || null,
        timezone: formData.timezone,
        isOnline: formData.isOnline,
        eventType: formData.eventType,
        requiresDeposit: formData.requiresDeposit,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        status: formData.status,
      }

      // Create or update
      const url = eventId ? `/api/admin/events/${eventId}` : '/api/admin/events'
      const method = eventId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await response.json()
        alert(eventId ? 'Event updated successfully!' : 'Event created successfully!')
        router.push('/admin/events')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Annual Community Gathering 2025"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Describe your event..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Only published events are visible to users</p>
        </div>
      </div>

      {/* Date and Location */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Date & Location</h2>

        {/* All Day Toggle */}
        <div className="flex items-center gap-2">
          <input
            id="isAllDay"
            type="checkbox"
            checked={formData.isAllDay}
            onChange={(e) => {
              const isAllDay = e.target.checked
              // Convert date format when toggling
              const convertDate = (dateStr: string): string => {
                if (!dateStr) return ''
                if (isAllDay) {
                  // Converting to date-only: take first 10 chars (YYYY-MM-DD)
                  return dateStr.slice(0, 10)
                } else {
                  // Converting to datetime: append default time
                  return dateStr.length === 10 ? `${dateStr}T09:00` : dateStr
                }
              }
              setFormData({
                ...formData,
                isAllDay,
                startDate: convertDate(formData.startDate),
                endDate: convertDate(formData.endDate),
              })
            }}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
          />
          <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
            All Day Event
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              {formData.isAllDay ? 'Start Date' : 'Start Date & Time'} <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              {formData.isAllDay ? 'End Date' : 'End Date & Time'}
            </label>
            <input
              id="endDate"
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Location */}
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={citySearch}
            onChange={(e) => handleCitySearch(e.target.value)}
            onFocus={() => citySearch.length >= 2 && setShowCityResults(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Search city..."
            autoComplete="off"
          />

          {/* City Results Dropdown */}
          {showCityResults && cityResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {cityResults.map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectCity(city)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{city.displayName}</div>
                  <div className="text-xs text-gray-500">{city.timezone}</div>
                </button>
              ))}
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">Timezone: {formData.timezone}</p>
        </div>

        {/* Online Event */}
        <div className="flex items-center gap-2">
          <input
            id="isOnline"
            type="checkbox"
            checked={formData.isOnline}
            onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
          />
          <label htmlFor="isOnline" className="text-sm font-medium text-gray-700">
            This is an online event
          </label>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>

        {/* Event Type */}
        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <select
            id="eventType"
            value={formData.eventType}
            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="FREE">Free Event</option>
            <option value="PAID">Paid Event</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.eventType === 'PAID'
              ? 'Pricing will be configured with line items after creating the event'
              : 'Free events have no registration fees'}
          </p>
        </div>

        {/* Deposit Settings - Only for paid events */}
        {formData.eventType === 'PAID' && (
          <>
            <div className="flex items-center gap-2">
              <input
                id="requiresDeposit"
                type="checkbox"
                checked={formData.requiresDeposit}
                onChange={(e) => setFormData({ ...formData, requiresDeposit: e.target.checked })}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <label htmlFor="requiresDeposit" className="text-sm font-medium text-gray-700">
                Require deposit to confirm registration
              </label>
            </div>

            {formData.requiresDeposit && (
              <div>
                <label
                  htmlFor="depositAmount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Deposit Amount ($)
                </label>
                <input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="0.00"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Amount required upfront to confirm registration
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Capacity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Capacity</h2>

        <div>
          <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Attendees
          </label>
          <input
            id="maxAttendees"
            type="number"
            min="0"
            value={formData.maxAttendees}
            onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Leave blank for unlimited"
          />
          <p className="mt-1 text-sm text-gray-500">
            Set to 0 or leave blank for unlimited capacity
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
        </button>
        <Link
          href="/admin/events"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </Link>
      </div>

      {/* Line Items Info - Only show when editing */}
      {eventId && formData.eventType === 'PAID' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 After saving, scroll down to manage line items (dues, deposits, supplements) for this
            paid event.
          </p>
        </div>
      )}
    </form>
  )
}
