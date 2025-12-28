'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('If an account exists with this email, you will receive password reset instructions.')
      } else {
        setStatus('error')
        setMessage(data.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🔥 Fire Platform</h1>
          <h2 className="mt-6 text-2xl font-semibold">Reset your password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">{message}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-green-700 hover:text-green-900 underline"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {status === 'error' && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <Link href="/login" className="block text-sm text-primary hover:underline">
                ← Back to login
              </Link>
              <Link href="/register" className="block text-sm text-muted-foreground hover:text-primary">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
