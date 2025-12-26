'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function FixRedirectPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fixRedirect = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/update-logto-redirect', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Fix OAuth Redirect URI</h1>
        
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-4">
            This will update the LogTo application to use the correct NextAuth callback URL.
          </p>
          
          <button
            onClick={fixRedirect}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Update Redirect URIs'}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


