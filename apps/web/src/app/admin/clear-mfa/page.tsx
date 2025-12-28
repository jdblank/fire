'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function ClearMFAPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const clearMFA = async () => {
    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/admin/clear-user-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setResult(`✅ ${data.message}`)
      } else {
        setResult(`❌ ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return <div>Admin access required</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Clear 2FA for Josh</h1>

        <div className="bg-white p-6 rounded-lg border">
          <button
            onClick={clearMFA}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Clearing...' : 'Clear All 2FA Settings'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p>{result}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            This will remove all TOTP and Passkey verifications from your account.
          </p>
        </div>
      </main>
    </div>
  )
}
