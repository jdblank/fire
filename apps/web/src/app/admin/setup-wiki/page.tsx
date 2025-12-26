'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

export default function SetupWikiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup-outline-sso', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to setup SSO')
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
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Setup Wiki SSO
        </h1>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-gray-600 mb-6">
            This will configure Outline wiki to use your Fire/LogTo credentials for automatic login.
          </p>

          <button
            onClick={handleSetup}
            disabled={loading || result !== null}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : result ? 'Already configured' : 'Setup Wiki SSO'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">✅ {result.message}</p>
              <div className="text-sm text-gray-700 mb-3 space-y-1">
                <p><strong>Client ID:</strong> {result.clientId}</p>
                {result.clientSecret && (
                  <p className="font-mono text-xs bg-white p-2 rounded border">
                    <strong>Client Secret:</strong> {result.clientSecret}
                  </p>
                )}
              </div>

              {result.config && (
                <div className="bg-white p-4 rounded border border-green-300 mt-4">
                  <p className="font-medium text-gray-900 mb-2">Configuration:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {result.config}
                  </pre>
                  <p className="text-xs text-gray-600 mt-2">
                    This has been saved to docker-compose.override.yml
                  </p>
                </div>
              )}
              
              <div className="bg-white p-4 rounded border border-green-300 mt-4">
                <p className="font-medium text-gray-900 mb-2">Next Steps:</p>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  {result.instructions?.map((instruction: string, i: number) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <button
                onClick={() => router.push('/wiki')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Wiki
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

