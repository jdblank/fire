import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { prisma } from '@fire/db'
import { RegisterForm } from './RegisterForm'
import { CancelRegistrationButton } from './CancelRegistrationButton'
import { formatDateInternational, formatTime } from '@/lib/date-utils'
import Link from 'next/link'
import { hasRole } from '@/lib/utils'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Fetch full user profile with dateOfBirth
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      dateOfBirth: true,
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  // Cast dbUser to compatible type for RegisterForm
  const userForForm: any = {
    ...dbUser,
    dateOfBirth: dbUser.dateOfBirth?.toISOString(),
  }

  // Fetch event
  const eventData = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })

  if (!eventData) {
    notFound()
  }

  // Cast event to compatible type
  const event: any = {
    ...eventData,
    depositAmount: eventData.depositAmount?.toString(),
  }

  // Check if event is published (admins can view any status)
  if (event.status !== 'PUBLISHED' && !hasRole(session.user, 'admin')) {
    notFound()
  }

  // Check if user is already registered (exclude cancelled)
  const existingRegistration = await prisma.eventRegistration.findFirst({
    where: {
      eventId: eventId,
      userId: session.user.id,
      status: {
        not: 'CANCELLED',
      },
    },
    include: {
      lineItems: {
        include: {
          lineItem: true,
        },
      },
      discounts: true,
    },
  })

  // Check capacity
  const isFull = event.maxAttendees && event._count.registrations >= event.maxAttendees
  const isAdmin = hasRole(session.user, 'admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">{event.title}</h1>
              {event.eventType === 'PAID' ? (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded font-medium">
                  PAID EVENT
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded font-medium">
                  FREE EVENT
                </span>
              )}
            </div>
            {event.status !== 'PUBLISHED' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded font-medium">
                {event.status}
              </span>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">
                  {formatDateInternational(
                    event.startDate,
                    event.timezone || undefined,
                    event.isAllDay
                  )}
                  {event.endDate && event.isAllDay && (
                    <>
                      {' '}
                      -{' '}
                      {formatDateInternational(
                        event.endDate,
                        event.timezone || undefined,
                        event.isAllDay
                      )}
                    </>
                  )}
                </p>
                {event.isAllDay ? (
                  <p className="text-sm text-gray-600">All Day</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {formatTime(event.startDate, event.timezone || undefined)}
                    {event.endDate && (
                      <> - {formatTime(event.endDate, event.timezone || undefined)}</>
                    )}
                  </p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-medium text-gray-900">{event.location}</p>
                  {event.isOnline && <p className="text-sm text-gray-600">Online event</p>}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {event._count.registrations} registered
                    {event.maxAttendees && ` / ${event.maxAttendees} capacity`}
                  </p>
                  {isFull && <p className="text-sm text-red-600">Event is at full capacity</p>}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Event</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        {/* Registration Section */}
        {existingRegistration ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Registration</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">✓ You&apos;re registered for this event!</p>
              {existingRegistration.status === 'CANCELLED' && (
                <p className="text-yellow-700 text-sm mt-1">Registration was cancelled</p>
              )}
            </div>
            <div className="flex gap-4">
              {event.eventType === 'PAID' && (
                <Link
                  href={`/registrations/${existingRegistration.id}/invoice`}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  View Invoice
                </Link>
              )}
              {event.eventType === 'FREE' && existingRegistration.status !== 'CANCELLED' && (
                <CancelRegistrationButton registrationId={existingRegistration.id} />
              )}
              <Link
                href="/events"
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Events
              </Link>
            </div>
          </div>
        ) : isFull ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">This event is at full capacity</p>
              <p className="text-sm text-red-600 mt-1">Registration is closed</p>
            </div>
          </div>
        ) : event.status !== 'PUBLISHED' ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                This event is not yet open for registration
              </p>
            </div>
          </div>
        ) : (
          <RegisterForm event={event} user={userForForm} />
        )}
      </main>
    </div>
  )
}
