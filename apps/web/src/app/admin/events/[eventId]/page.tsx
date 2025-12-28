import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { Header } from '@/components/Header'
import { EventForm } from '../EventForm'
import { LineItemsEditor } from './LineItemsEditor'
import { prisma } from '@fire/db'
import Link from 'next/link'

// Helper to convert Decimal to number for client components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeDecimal(value: any): number | null {
  if (value === null || value === undefined) return null
  return Number(value)
}

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch event data
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: {
          registrations: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  // Serialize Decimal fields for client component
  const serializedEvent = {
    ...event,
    depositAmount: serializeDecimal(event.depositAmount),
    lineItems: event.lineItems.map(item => ({
      ...item,
      baseAmount: serializeDecimal(item.baseAmount),
      minAmount: serializeDecimal(item.minAmount),
      maxAmount: serializeDecimal(item.maxAmount),
      multiplier: serializeDecimal(item.multiplier),
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Edit Event
              </h1>
              <p className="text-gray-500">
                Update event details and manage line items
              </p>
            </div>
            <Link
              href={`/admin/events/${event.id}/registrations`}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View Registrations ({event._count.registrations})
            </Link>
          </div>
        </div>

        <EventForm eventId={event.id} initialData={serializedEvent} />
        
        {/* Line Items Editor - Only for paid events */}
        {event.eventType === 'PAID' && (
          <LineItemsEditor eventId={event.id} />
        )}
      </main>
    </div>
  )
}
