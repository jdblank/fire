'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn('logto', {
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
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            Authentication failed. Please try again.
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Redirecting...' : 'Sign In with Fire'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Secure authentication powered by OAuth 2.0
        </p>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-gray-900 font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
