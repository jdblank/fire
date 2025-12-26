import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { EventForm } from '../EventForm'

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Create New Event
          </h1>
          <p className="text-gray-500">
            Fill out event details. You can add line items and pricing after creating the event.
          </p>
        </div>

        <EventForm />
      </main>
    </div>
  )
}

