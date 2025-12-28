'use client'

import { useState } from 'react'

interface PasskeyEnrollmentProps {
  onSuccess: () => void
  onCancel: () => void
}

export function PasskeyEnrollment({ onSuccess: _onSuccess, onCancel }: PasskeyEnrollmentProps) {
  const [step, setStep] = useState<'intro' | 'enrolling' | 'success'>('intro')
  const [error, setError] = useState<string | null>(null)

  const handleEnroll = async () => {
    setStep('enrolling')
    setError(null)

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys are not supported on this device/browser')
      }

      // Note: Full WebAuthn implementation requires complex credential creation
      // This is a placeholder for the actual WebAuthn flow
      setError('Passkey enrollment requires additional WebAuthn implementation. Coming soon!')
      setStep('intro')

      // TODO: Implement WebAuthn credential creation
      // 1. Call API to get challenge from LogTo
      // 2. Use navigator.credentials.create()
      // 3. Send attestation to LogTo
      // 4. Verify and store credential
    } catch (err) {
      setError((err as Error).message)
      setStep('intro')
    }
  }

  return (
    <div className="space-y-6">
      {step === 'intro' && (
        <>
          <div className="text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What are Passkeys?</h3>
            <p className="text-gray-600 mb-4">
              Passkeys let you sign in using your device&apos;s biometrics (Face ID, Touch ID,
              Windows Hello) or a hardware security key. They&apos;re more secure than passwords and
              easier to use.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Supported On:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>iPhone/iPad with Face ID or Touch ID</li>
              <li>Mac with Touch ID</li>
              <li>Android with fingerprint sensor</li>
              <li>Windows with Windows Hello</li>
              <li>Hardware security keys (YubiKey, etc.)</li>
            </ul>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleEnroll}
              disabled={step === 'enrolling'}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {step === 'enrolling' ? 'Setting up...' : 'Setup Passkey'}
            </button>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">Passkey Registered!</h3>
          <p className="text-gray-600">You can now use your biometrics to sign in</p>
        </div>
      )}
    </div>
  )
}
