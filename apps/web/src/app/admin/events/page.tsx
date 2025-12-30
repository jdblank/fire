import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'
import { EventsTable } from './EventsTable'
import { hasRole } from '@/lib/utils'

export default async function AdminEventsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (!hasRole(session.user, 'admin')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Event Management</h1>
            <p className="text-gray-500">Create and manage events with flexible pricing</p>
          </div>
          <Link
            href="/admin/events/create"
            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Create Event
          </Link>
        </div>

        {/* Events Table */}
        <EventsTable />
      </main>
    </div>
  )
}
