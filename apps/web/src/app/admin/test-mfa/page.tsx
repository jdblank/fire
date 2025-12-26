'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function TestMFAPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<string>('')

  const enforceMFA = async () => {
    const response = await fetch('/api/admin/enforce-mfa', { method: 'POST' })
    const data = await response.json()
    setResult(JSON.stringify(data, null, 2))
  }

  if (session?.user?.role !== 'ADMIN') return <div>Admin only</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl mb-4">Enforce MFA Policy</h1>
        <button
          onClick={enforceMFA}
          className="bg-red-600 text-white px-6 py-3 rounded-lg"
        >
          Set MFA Policy to Mandatory
        </button>
        <pre className="mt-4 p-4 bg-gray-100 text-xs">{result}</pre>
        <p className="mt-4 text-sm text-gray-600">
          This will make 2FA required for all users who have it set up
        </p>
      </main>
    </div>
  )
}


