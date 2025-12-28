'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserFormProps {
  userId?: string
  initialData?: any
}

interface ReferralOption {
  id: string
  email: string
  displayName: string | null
}

export function UserForm({ userId, initialData }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchingReferrals, setSearchingReferrals] = useState(false)
  const [referralOptions, setReferralOptions] = useState<ReferralOption[]>([])
  const [referralSearch, setReferralSearch] = useState('')

  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    displayName: initialData?.displayName || '',
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
      : '',
    countryCode: initialData?.countryCode || '+1',
    mobilePhone: initialData?.mobilePhone || '',
    hometown: initialData?.hometown || '',
    referredById: initialData?.referredById || '',
    role: initialData?.role || 'USER',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Search for referral users
  useEffect(() => {
    if (referralSearch.length < 2) {
      setReferralOptions([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingReferrals(true)
      try {
        const response = await fetch(
          `/api/admin/users?search=${encodeURIComponent(referralSearch)}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          setReferralOptions(data.users.filter((u: any) => u.id !== userId)) // Exclude self
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearchingReferrals(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [referralSearch, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.firstName) newErrors.firstName = 'First name is required'
      if (!formData.lastName) newErrors.lastName = 'Last name is required'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setLoading(false)
        return
      }

      // Prepare data
      const data = {
        ...formData,
        // Combine country code and phone number if provided
        mobilePhone: formData.mobilePhone
          ? `${formData.countryCode}-${formData.mobilePhone}`
          : null,
        dateOfBirth: formData.dateOfBirth || null,
        referredById: formData.referredById || null,
      }

      // Create or update
      const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users'
      const method = userId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await response.json()
        alert(userId ? 'User updated successfully!' : 'User created successfully!')
        router.push('/admin/users')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
    >
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="user@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* Name Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="John"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Doe"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="Leave blank to use First + Last Name"
        />
        <p className="mt-1 text-sm text-gray-500">
          This is how the user&apos;s name will appear to others
        </p>
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth
        </label>
        <input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Mobile Phone */}
      <div>
        <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Phone
        </label>
        <div className="flex gap-2">
          <select
            value={formData.countryCode}
            onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="+1">+1 (US/CA)</option>
            <option value="+44">+44 (UK)</option>
            <option value="+61">+61 (AU)</option>
            <option value="+33">+33 (FR)</option>
            <option value="+49">+49 (DE)</option>
            <option value="+81">+81 (JP)</option>
            <option value="+86">+86 (CN)</option>
            <option value="+91">+91 (IN)</option>
          </select>
          <input
            id="mobilePhone"
            type="tel"
            value={formData.mobilePhone}
            onChange={(e) =>
              setFormData({ ...formData, mobilePhone: e.target.value.replace(/[^0-9-]/g, '') })
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="555-1234"
          />
        </div>
      </div>

      {/* Hometown */}
      <div>
        <label htmlFor="hometown" className="block text-sm font-medium text-gray-700 mb-2">
          Hometown
        </label>
        <input
          id="hometown"
          type="text"
          value={formData.hometown}
          onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="City, State"
        />
      </div>

      {/* Referred By */}
      <div>
        <label htmlFor="referral" className="block text-sm font-medium text-gray-700 mb-2">
          Referred By
        </label>
        <input
          id="referral"
          type="text"
          value={referralSearch}
          onChange={(e) => setReferralSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {searchingReferrals && <p className="mt-1 text-sm text-gray-500">Searching...</p>}
        {referralOptions.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
            {referralOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, referredById: option.id })
                  setReferralSearch(option.displayName || option.email)
                  setReferralOptions([])
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                <div className="font-medium">{option.displayName || option.email}</div>
                <div className="text-gray-500">{option.email}</div>
              </button>
            ))}
          </div>
        )}
        {formData.referredById && (
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, referredById: '' })
              setReferralSearch('')
            }}
            className="mt-2 text-sm text-red-600 hover:text-red-900"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Role
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : userId ? 'Update User' : 'Create User'}
        </button>
        <Link
          href="/admin/users"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
