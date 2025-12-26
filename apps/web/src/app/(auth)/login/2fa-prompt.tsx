'use client'

import { useState } from 'react'

interface TwoFactorPromptProps {
  email?: string // Not currently used but kept for future
  onVerified: (code: string) => void
  onCancel: () => void
}

export function TwoFactorPrompt({ email: _email, onVerified, onCancel }: TwoFactorPromptProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setError(null)
    onVerified(code)
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-medium">Two-Factor Authentication Required</span>
        </div>
        <p className="text-sm text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          autoFocus
          autoComplete="one-time-code"
        />

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={code.length !== 6}
          className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Verify & Sign In
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </form>
    </div>
  )
}


