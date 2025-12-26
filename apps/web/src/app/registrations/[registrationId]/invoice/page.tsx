import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { InvoiceContent } from './InvoiceContent'

export default async function InvoicePage({ params }: { params: { registrationId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <InvoiceContent registrationId={params.registrationId} isAdmin={isAdmin} />
      </main>
    </div>
  )
}
