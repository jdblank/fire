'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { useEffect } from 'react'

interface TOTPEnrollmentProps {
  onSuccess: () => void
  onCancel: () => void
}

export function TOTPEnrollment({ onSuccess, onCancel }: TOTPEnrollmentProps) {
  const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'success'>('loading')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [verificationId, setVerificationId] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    setupTOTP()
  }, [])

  const setupTOTP = async () => {
    try {
      const response = await fetch('/api/user/mfa/totp/setup', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate TOTP secret')
      }

      const data = await response.json()
      console.log('TOTP setup response:', data)
      
      if (!data.secret || !data.qrCode) {
        throw new Error('Invalid response from server')
      }

      setSecret(data.secret)
      setVerificationId(data.verificationId || data.secret) // Fallback to secret if no ID

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(data.qrCode, {
        width: 250,
        margin: 2,
      })
      setQrCodeDataUrl(qrDataUrl)
      setStep('scan')
    } catch (err) {
      console.error('TOTP setup error:', err)
      setError((err as Error).message)
      setStep('scan')
    }
  }

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    if (!verificationId && !secret) {
      setError('Missing verification data. Please try again.')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      console.log('Verifying with:', { code, verificationId, hasSecret: !!secret })
      
      const response = await fetch('/api/user/mfa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          verificationId: verificationId || secret, // Use secret as fallback
          secret
        })
      })

      const data = await response.json()
      console.log('Verify response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Invalid code')
      }

      setStep('success')
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      console.error('Verification error:', err)
      setError((err as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === 'loading' && (
        <div className="text-center py-8">
          <div className="text-gray-600">Generating secure code...</div>
        </div>
      )}

      {step === 'scan' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Step 1: Scan QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Use Google Authenticator, Authy, or any TOTP app
            </p>

            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            )}

            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Or enter this code manually:</p>
              <code className="text-sm font-mono text-gray-900 break-all">
                {secret}
              </code>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Step 2: Enter Verification Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl font-mono border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={code.length !== 6 || verifying}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {verifying ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">
            2FA Enabled Successfully!
          </h3>
          <p className="text-gray-600">
            Your account is now protected with two-factor authentication
          </p>
        </div>
      )}
    </div>
  )
}

