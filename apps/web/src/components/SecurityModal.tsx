'use client'

import { TOTPEnrollment } from './TOTPEnrollment'
import { PasskeyEnrollment } from './PasskeyEnrollment'
import { PasswordChange } from './PasswordChange'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  type: '2fa' | 'passkey' | 'password'
}

export function SecurityModal({
  isOpen,
  onClose,
  type
}: SecurityModalProps) {
  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  const getTitle = () => {
    switch (type) {
      case '2fa': return 'Enable Two-Factor Authentication'
      case 'passkey': return 'Setup Passkey'
      case 'password': return 'Change Password'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">
            {getTitle()}
          </h3>
        </div>

        {/* Content */}
        <div>
          {type === '2fa' && <TOTPEnrollment onSuccess={handleSuccess} onCancel={onClose} />}
          {type === 'passkey' && <PasskeyEnrollment onSuccess={handleSuccess} onCancel={onClose} />}
          {type === 'password' && <PasswordChange onSuccess={handleSuccess} onCancel={onClose} />}
        </div>
      </div>
    </div>
  )
}

