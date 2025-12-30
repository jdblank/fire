import { notFound } from 'next/navigation'
import { prisma } from '@fire/db'
import { InviteAcceptForm } from './InviteAcceptForm'
import Link from 'next/link'

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Validate token
  const inviteToken = await prisma.inviteToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          accountStatus: true,
        },
      },
    },
  })

  if (!inviteToken) {
    notFound()
  }

  // Check if token is already used
  if (inviteToken.usedAt) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invite Already Used</h1>
          <p className="text-gray-500 mb-8">
            This invite link has already been used. If you have an account, please sign in.
          </p>
          <Link
            href="/login"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Check if token is expired
  if (new Date() > inviteToken.expiresAt) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invite Expired</h1>
          <p className="text-gray-500 mb-8">
            This invite link has expired. Please contact an administrator for a new invite.
          </p>
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Fire!</h1>
          <p className="text-gray-500">Set your password to complete your account setup</p>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Setting up account for:</div>
          <div className="font-semibold text-gray-900">
            {inviteToken.user.displayName ||
              `${inviteToken.user.firstName} ${inviteToken.user.lastName}`.trim()}
          </div>
          <div className="text-sm text-gray-600">{inviteToken.user.email}</div>
        </div>

        <InviteAcceptForm token={token} user={inviteToken.user} />
      </div>
    </div>
  )
}
