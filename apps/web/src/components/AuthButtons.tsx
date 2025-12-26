'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function AuthButtons() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn('logto', { callbackUrl: '/dashboard' })
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    // Use logto-signup provider to force "Sign up" tab on LogTo
    await signIn('logto-signup', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSignUp}
        disabled={isLoading}
        className="block w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        Sign Up
      </button>
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="block w-full bg-white text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Sign In
      </button>
    </div>
  )
}
