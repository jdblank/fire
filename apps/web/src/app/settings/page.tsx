'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { SecurityModal } from '@/components/SecurityModal'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Settings
        </h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile
            </h2>
            <p className="text-gray-600 mb-4">
              Update your personal information and profile photo
            </p>
            <Link
              href="/profile"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Security & Authentication
            </h2>
            <p className="text-gray-600 mb-6">
              Enhance your account security with advanced authentication methods
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Add an extra layer of security with Google Authenticator, Authy, or similar apps
                    </p>
                    <button
                      onClick={() => setActiveModal('2fa')}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔑</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-purple-900 mb-1">Passkeys (Face ID / Touch ID)</h3>
                    <p className="text-sm text-purple-800 mb-3">
                      Use biometric authentication or hardware security keys for secure, password-free login
                    </p>
                    <button
                      onClick={() => setActiveModal('passkey')}
                      className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Setup Passkey
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">Password</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Change your password or reset it if you&apos;ve forgotten
                    </p>
                    <button
                      onClick={() => setActiveModal('password')}
                      className="inline-block bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Privacy
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-600">Allow others to view your profile</p>
              </div>
              <div className="text-sm text-gray-500">
                Currently: Public
              </div>
            </div>
          </div>
        </div>

        {/* Security Modals */}
        {activeModal && (
          <SecurityModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            type={activeModal as '2fa' | 'passkey' | 'password'}
          />
        )}
      </main>
    </div>
  )
}
