import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { UserForm } from '../UserForm'
import { RegisterUserForm } from './RegisterUserForm'
import { ClearMfaButton } from './ClearMfaButton'
import { prisma } from '@fire/db'
import Link from 'next/link'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/date-utils'
import { hasRole } from '@/lib/utils'

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (!hasRole(session.user, 'admin')) {
    redirect('/dashboard')
  }

  // Fetch user data with event history
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referredBy: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
      eventRegistrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              timezone: true,
              eventType: true,
              status: true,
            },
          },
          lineItems: {
            include: {
              lineItem: true,
            },
          },
          discounts: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Group events by type
  const paidEvents = user.eventRegistrations.filter((r) => r.event.eventType === 'PAID')
  const freeEvents = user.eventRegistrations.filter((r) => r.event.eventType === 'FREE')

  // Calculate total spent
  const totalSpent = user.eventRegistrations.reduce(
    (sum, reg) => sum + parseFloat(reg.totalAmount.toString()),
    0
  )

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      UNPAID: 'bg-red-100 text-red-800',
      DEPOSIT_PAID: 'bg-yellow-100 text-yellow-800',
      FULLY_PAID: 'bg-green-100 text-green-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-500">
            {user.displayName || `${user.firstName} ${user.lastName}`.trim()} • {user.email}
          </p>
        </div>

        {/* User Profile Form */}
        <UserForm userId={user.id} initialData={user} />

        {/* Register User for Event Form */}
        <RegisterUserForm user={{ id: user.id, dateOfBirth: user.dateOfBirth }} />

        {/* Security Settings Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Manage user&apos;s 2FA settings</p>
              </div>
              <ClearMfaButton userId={user.id} />
            </div>
          </div>
        </div>

        {/* Event History Section */}
        <div id="events" className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Event History</h2>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-500">Total Events:</span>{' '}
                <span className="font-medium text-gray-900">{user.eventRegistrations.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Paid Events:</span>{' '}
                <span className="font-medium text-gray-900">{paidEvents.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Free Events:</span>{' '}
                <span className="font-medium text-gray-900">{freeEvents.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Spent:</span>{' '}
                <span className="font-medium text-gray-900">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
          </div>

          {user.eventRegistrations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No event registrations yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Paid Events */}
              {paidEvents.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Paid Events ({paidEvents.length})
                  </h3>
                  <div className="space-y-2">
                    {paidEvents.map((registration) => (
                      <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <Link
                              href={`/admin/events/${registration.event.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {registration.event.title}
                            </Link>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDateShort(
                                registration.event.startDate,
                                registration.event.timezone || undefined
                              )}{' '}
                              • {registration.event.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(registration.totalAmount.toString()))}
                            </div>
                            {getPaymentStatusBadge(registration.paymentStatus)}
                          </div>
                        </div>

                        {registration.lineItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Line Items:</p>
                            <div className="space-y-1">
                              {registration.lineItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.lineItem.name}</span>
                                  <span className="text-gray-900">
                                    {formatCurrency(parseFloat(item.calculatedAmount.toString()))}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {registration.discounts.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                {registration.discounts.map((discount) => (
                                  <div key={discount.id} className="flex justify-between text-sm">
                                    <span className="text-green-600">{discount.name}</span>
                                    <span className="text-green-600">
                                      -{formatCurrency(parseFloat(discount.amount.toString()))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/registrations/${registration.id}/invoice`}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            View Invoice
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free Events */}
              {freeEvents.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Free Events ({freeEvents.length})
                  </h3>
                  <div className="space-y-2">
                    {freeEvents.map((registration) => (
                      <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link
                              href={`/admin/events/${registration.event.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {registration.event.title}
                            </Link>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDateShort(
                                registration.event.startDate,
                                registration.event.timezone || undefined
                              )}{' '}
                              • {registration.event.location}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            FREE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
