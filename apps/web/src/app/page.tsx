import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthButtons } from '@/components/AuthButtons'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Simple landing page for non-logged-in users
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo & Tagline */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Fire
        </h1>
        <p className="text-xl text-gray-600 mb-3">
          Community & Events Platform
        </p>
        <p className="text-gray-500 mb-12 max-w-md mx-auto">
          Connect with your community, discover events, and stay updated with the latest news
        </p>

        {/* Auth Buttons */}
        <div className="mb-16">
          <AuthButtons />
        </div>
      </div>
    </main>
  )
}
