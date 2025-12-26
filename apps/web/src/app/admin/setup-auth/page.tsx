'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import Link from 'next/link'

export default function SetupAuthPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)


  const handleSetup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup-auth-features', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to setup auth features')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session?.user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Admin access required
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Setup Advanced Authentication
          </h1>
          <p className="text-gray-600">
            Enable passkeys, passwordless login, and two-factor authentication
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Features to Enable:
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-purple-600">📧</span>
                <span><strong>Email Passwordless</strong> - Sign in with verification codes (no password)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">🔐</span>
                <span><strong>Two-Factor Authentication</strong> - TOTP, Passkeys, backup codes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">🔑</span>
                <span><strong>Passkeys (WebAuthn MFA)</strong> - Face ID, Touch ID for 2FA</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSetup}
            disabled={loading || result !== null}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Configuring...' : result ? 'Already Configured' : 'Enable Authentication Features'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
              <p className="text-green-800 font-medium text-lg">
                ✅ {result.message}
              </p>

              {result.results?.features && result.results.features.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Enabled Features:</h3>
                  <div className="space-y-2">
                    {result.results.features.map((feature: any, i: number) => (
                      <div key={i} className="bg-white p-3 rounded border border-green-300">
                        <div className="font-medium text-gray-900">{feature.name}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.results?.errors && result.results.errors.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Errors:</h3>
                  <div className="space-y-2">
                    {result.results.errors.map((err: any, i: number) => (
                      <div key={i} className="bg-red-100 p-3 rounded border border-red-300 text-sm">
                        <div className="font-medium text-red-900">{err.feature}</div>
                        <div className="text-red-700">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.instructions && (
                <div className="bg-white p-4 rounded border border-green-300 mt-4">
                  <p className="font-medium text-gray-900 mb-2">How to Use:</p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    {result.instructions.map((instruction: string, i: number) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.nextSteps && (
                <div className="bg-blue-50 p-4 rounded border border-blue-300 mt-4">
                  <p className="font-medium text-blue-900 mb-2">Next Steps:</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    {result.nextSteps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!result && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">What This Will Do:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
                <div>
                  <p className="font-medium text-gray-900">✅ Email Passwordless Login</p>
                  <p className="text-gray-600">Users can sign in by receiving a verification code via email (no password needed)</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">✅ Two-Factor Authentication</p>
                  <p className="text-gray-600">Users can optionally enable TOTP (Google Authenticator), Passkeys (WebAuthn), or backup codes for additional security</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">✅ Passkeys (WebAuthn)</p>
                  <p className="text-gray-600">Available as MFA option - users can use Face ID, Touch ID, or security keys for 2FA</p>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <p className="text-gray-700"><strong>Note:</strong> Social logins (Google/GitHub) require OAuth app setup and will be configured separately.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

