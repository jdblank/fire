'use client'

import { useState } from 'react'

export function ClearMfaButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClear = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Clear all 2FA settings for this user?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/clear-user-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await response.json()
      alert(data.message || data.error)
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      alert('Failed to clear 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={`/api/admin/clear-user-mfa`} method="POST">
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
        onClick={handleClear}
      >
        {isLoading ? 'Clearing...' : 'Clear 2FA'}
      </button>
    </form>
  )
}
