'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    setIsLoading(true)
    // Use logto-signup provider to land on Sign Up tab
    await signIn('logto-signup', {
      callbackUrl: '/dashboard',
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-gray-900">
            Fire
          </Link>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        {/* Sign Up Button */}
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Redirecting...' : 'Create Account with Fire'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Secure authentication powered by OAuth 2.0
        </p>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
