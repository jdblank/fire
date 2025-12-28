import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { prisma } from '@fire/db'
import Link from 'next/link'
import { formatDateShort } from '@/lib/date-utils'

export default async function EventsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'ADMIN'

  // Fetch published events
  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: {
        gte: new Date(), // Only show upcoming events
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      banner: true,
      startDate: true,
      endDate: true,
      location: true,
      timezone: true,
      eventType: true,
      maxAttendees: true,
      // Only fetch registration count for admins
      ...(isAdmin && {
        _count: {
          select: {
            registrations: true,
          },
        },
      }),
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  // Check which events the user is registered for (exclude cancelled)
  const userRegistrations = await prisma.eventRegistration.findMany({
    where: {
      userId: session.user.id,
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      eventId: true,
      paymentStatus: true,
    },
  })

  const registeredEventIds = new Set(userRegistrations.map((r) => r.eventId))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Upcoming Events</h1>
          <p className="text-gray-500">Browse and register for community events</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-2">No upcoming events</p>
            <p className="text-sm text-gray-400">Check back soon for new events!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id)
              // For admins, check actual count; for users, just check if maxAttendees exists (will check on detail page)
              const isFull =
                isAdmin && event._count
                  ? event.maxAttendees && event._count.registrations >= event.maxAttendees
                  : false

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  {event.banner && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={event.banner}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      {event.eventType === 'PAID' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                          PAID
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                          FREE
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDateShort(event.startDate, event.timezone || undefined)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {isRegistered ? (
                        <span className="text-green-600 font-medium text-sm">
                          ✓ You&apos;re registered
                        </span>
                      ) : isFull ? (
                        <span className="text-red-600 font-medium text-sm">Event Full</span>
                      ) : (
                        <span className="text-blue-600 font-medium text-sm">
                          View Details & Register →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
