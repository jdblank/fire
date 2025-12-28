import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { prisma } from '@fire/db'
import Link from 'next/link'
import { formatCurrency } from '@/lib/pricing'
import { formatDateShort } from '@/lib/date-utils'

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch event with registrations
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              displayName: true,
              mobilePhone: true,
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
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!event) {
    notFound()
  }

  // Calculate totals (exclude cancelled registrations)
  const activeRegistrations = event.registrations.filter((r) => r.status !== 'CANCELLED')
  const totalRegistrations = activeRegistrations.length
  const totalRevenue = activeRegistrations.reduce(
    (sum, reg) => sum + parseFloat(reg.totalAmount.toString()),
    0
  )
  const totalDeposits = activeRegistrations.reduce(
    (sum, reg) => sum + parseFloat(reg.depositPaid.toString()),
    0
  )
  const totalBalance = activeRegistrations.reduce(
    (sum, reg) => sum + parseFloat(reg.balanceDue.toString()),
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

  const getRegistrationStatusBadge = (status: string) => {
    const styles = {
      CONFIRMED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      WAITLIST: 'bg-blue-100 text-blue-800',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/events"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Registrations: {event.title}
              </h1>
              <p className="text-gray-500">
                {formatDateShort(event.startDate, event.timezone || undefined)} • {event.location}
              </p>
            </div>
            <Link
              href={`/admin/events/${event.id}`}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Edit Event
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm text-gray-500 font-medium mb-2">Total Registrations</h3>
            <p className="text-3xl font-semibold text-gray-900">{totalRegistrations}</p>
            {event.maxAttendees && (
              <p className="text-sm text-gray-500 mt-1">of {event.maxAttendees} capacity</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm text-gray-500 font-medium mb-2">Total Revenue</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm text-gray-500 font-medium mb-2">Deposits Collected</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(totalDeposits)}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-sm text-gray-500 font-medium mb-2">Balance Due</h3>
            <p className="text-3xl font-semibold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">All Registrations</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attendee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deposit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {event.registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No registrations yet
                    </td>
                  </tr>
                ) : (
                  event.registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <Link
                            href={`/admin/users/${registration.user.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {registration.user.displayName ||
                              `${registration.user.firstName} ${registration.user.lastName}`.trim()}
                          </Link>
                          <div className="text-sm text-gray-500">{registration.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getRegistrationStatusBadge(registration.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {formatCurrency(parseFloat(registration.totalAmount.toString()))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(parseFloat(registration.depositPaid.toString()))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(parseFloat(registration.balanceDue.toString()))}
                      </td>
                      <td className="px-4 py-3">
                        {getPaymentStatusBadge(registration.paymentStatus)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateShort(registration.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/registrations/${registration.id}/invoice`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Invoice
                          </Link>
                          <Link
                            href={`/admin/users/${registration.user.id}#events`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
