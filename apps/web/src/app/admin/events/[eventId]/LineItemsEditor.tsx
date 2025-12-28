'use client'

import { useState, useEffect } from 'react'

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
  sortOrder: number
}

interface LineItemsEditorProps {
  eventId: string
}

export function LineItemsEditor({ eventId }: LineItemsEditorProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lineItemType: 'FIXED',
    isRequired: true,
    calculationMethod: 'FIXED_AMOUNT',
    baseAmount: '',
    minAmount: '',
    maxAmount: '',
    multiplier: '',
  })

  useEffect(() => {
    fetchLineItems()
  }, [])

  const fetchLineItems = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${eventId}/line-items`)
      if (response.ok) {
        const data = await response.json()
        setLineItems(data.lineItems)
      }
    } catch (error) {
      console.error('Error fetching line items:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      lineItemType: 'FIXED',
      isRequired: true,
      calculationMethod: 'FIXED_AMOUNT',
      baseAmount: '',
      minAmount: '',
      maxAmount: '',
      multiplier: '',
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleEdit = (item: LineItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      lineItemType: item.lineItemType,
      isRequired: item.isRequired,
      calculationMethod: item.calculationMethod,
      baseAmount: item.baseAmount || '',
      minAmount: item.minAmount || '',
      maxAmount: item.maxAmount || '',
      multiplier: item.multiplier || '',
    })
    setEditingId(item.id)
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert('Name is required')
      return
    }

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        lineItemType: formData.lineItemType,
        isRequired: formData.isRequired,
        calculationMethod: formData.calculationMethod,
        baseAmount: formData.baseAmount ? parseFloat(formData.baseAmount) : null,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        multiplier: formData.multiplier ? parseFloat(formData.multiplier) : null,
      }

      const url = editingId
        ? `/api/admin/events/${eventId}/line-items/${editingId}`
        : `/api/admin/events/${eventId}/line-items`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        alert(editingId ? 'Line item updated!' : 'Line item added!')
        fetchLineItems()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving line item:', error)
      alert('Failed to save line item')
    }
  }

  const handleDelete = async (itemId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return

    try {
      const response = await fetch(`/api/admin/events/${eventId}/line-items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Line item deleted')
        fetchLineItems()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting line item:', error)
      alert('Failed to delete line item')
    }
  }

  const getLineItemTypeLabel = (type: string) => {
    const labels = {
      AGE_BASED: 'Age-Based (Calculated)',
      FIXED: 'Fixed (Required)',
      OPTIONAL_FIXED: 'Optional Fixed',
      OPTIONAL_VARIABLE: 'Optional Variable',
    }
    return labels[type as keyof typeof labels] || type
  }

  const getCalculationLabel = (method: string, item: LineItem) => {
    if (method === 'AGE_MULTIPLIER') {
      return `Age × $${item.multiplier} (min: $${item.minAmount}, max: $${item.maxAmount})`
    } else if (method === 'FIXED_AMOUNT') {
      return `$${item.baseAmount}`
    } else if (method === 'PERCENTAGE') {
      return `${item.baseAmount}%`
    }
    return method
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Line Items & Pricing</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Add Line Item
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50"
        >
          <h3 className="font-medium text-gray-900">
            {editingId ? 'Edit Line Item' : 'Add Line Item'}
          </h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="e.g., Annual Dues, RV Supplement"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Optional description"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Line Item Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.lineItemType}
                onChange={(e) => {
                  const type = e.target.value
                  setFormData({
                    ...formData,
                    lineItemType: type,
                    calculationMethod: type === 'AGE_BASED' ? 'AGE_MULTIPLIER' : 'FIXED_AMOUNT',
                    isRequired: type === 'AGE_BASED' || type === 'FIXED',
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="AGE_BASED">Age-Based (Auto-calculated)</option>
                <option value="FIXED">Fixed (Required)</option>
                <option value="OPTIONAL_FIXED">Optional Fixed</option>
                <option value="OPTIONAL_VARIABLE">Optional Variable</option>
              </select>
            </div>

            {/* Calculation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calculation</label>
              <select
                value={formData.calculationMethod}
                onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={formData.lineItemType === 'AGE_BASED'}
              >
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="AGE_MULTIPLIER">Age × Multiplier</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>
          </div>

          {/* Age-Based Fields */}
          {formData.calculationMethod === 'AGE_MULTIPLIER' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="60"
                />
                <p className="text-xs text-gray-500 mt-1">$ per year of age</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="1800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="3600"
                />
              </div>
            </div>
          )}

          {/* Fixed Amount Field */}
          {formData.calculationMethod === 'FIXED_AMOUNT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="250.00"
              />
            </div>
          )}

          {/* Percentage Field */}
          {formData.calculationMethod === 'PERCENTAGE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="10"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {editingId ? 'Update' : 'Add'} Line Item
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Line Items List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading line items...</p>
        ) : lineItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No line items configured yet</p>
            <p className="text-xs mt-1">Add pricing components for this event</p>
          </div>
        ) : (
          lineItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.isRequired && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                        Required
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      {getLineItemTypeLabel(item.lineItemType)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {getCalculationLabel(item.calculationMethod, item)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Templates */}
      {!showAddForm && lineItems.length === 0 && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates:</p>
          <div className="grid md:grid-cols-3 gap-2">
            <button
              onClick={() => {
                setFormData({
                  name: 'Annual Dues',
                  description: 'Age-based membership dues',
                  lineItemType: 'AGE_BASED',
                  isRequired: true,
                  calculationMethod: 'AGE_MULTIPLIER',
                  baseAmount: '',
                  minAmount: '1800',
                  maxAmount: '3600',
                  multiplier: '60',
                })
                setShowAddForm(true)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              + Age-Based Dues
            </button>
            <button
              onClick={() => {
                setFormData({
                  name: 'Bike Deposit',
                  description: 'Refundable deposit for camp bike',
                  lineItemType: 'OPTIONAL_FIXED',
                  isRequired: false,
                  calculationMethod: 'FIXED_AMOUNT',
                  baseAmount: '250',
                  minAmount: '',
                  maxAmount: '',
                  multiplier: '',
                })
                setShowAddForm(true)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              + Bike Deposit
            </button>
            <button
              onClick={() => {
                setFormData({
                  name: 'RV Supplement',
                  description: 'Additional fee for RV parking',
                  lineItemType: 'OPTIONAL_FIXED',
                  isRequired: false,
                  calculationMethod: 'FIXED_AMOUNT',
                  baseAmount: '550',
                  minAmount: '',
                  maxAmount: '',
                  multiplier: '',
                })
                setShowAddForm(true)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              + RV Supplement
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
