'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function BrandAuthPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const brandLogTo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/brand-logto', {
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
        <h1 className="text-2xl font-semibold mb-4">Brand Authentication Pages</h1>
        
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <p className="text-gray-600">
            This will customize LogTo&apos;s login/register pages to match Fire&apos;s branding:
          </p>
          
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>Gray-900 primary color (matches Fire)</li>
            <li>Hide &quot;Powered by Logto&quot; footer</li>
            <li>Clean, minimal Fire aesthetic</li>
          </ul>
          
          <button
            onClick={brandLogTo}
            disabled={loading}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Applying Branding...' : 'Apply Fire Branding'}
          </button>

          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
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
