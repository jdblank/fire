'use client'

import { useState } from 'react'

interface CancelRegistrationButtonProps {
  registrationId: string
}

export function CancelRegistrationButton({ registrationId }: CancelRegistrationButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/registrations/${registrationId}/cancel`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to cancel registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Cancelling...' : 'Cancel Registration'}
    </button>
  )
}

