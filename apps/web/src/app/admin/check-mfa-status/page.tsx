'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function CheckMFAStatus() {
  const { data: session } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/check-user-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logtoId: 'amys6q4nfr6n',
        }),
      })

      const data = await response.json()

      // Also check user object
      const userResponse = await fetch('/api/admin/check-user-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logtoId: 'amys6q4nfr6n',
        }),
      })
      const userData = await userResponse.json()

      setResult({
        mfaVerifications: data,
        userObject: userData,
      })
    } catch (error) {
      setResult({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return <div>Admin only</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Check MFA Status</h1>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Check Josh&apos;s MFA Status
        </button>

        {result && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </main>
    </div>
  )
}
