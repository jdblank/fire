import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'
import { UsersTable } from './UsersTable'

export default async function AdminUsersPage() {
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
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-500">
              Create, edit, and manage user accounts
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users/import"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Import CSV
            </Link>
            <Link
              href="/admin/users/create"
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create User
            </Link>
          </div>
        </div>

        {/* Users Table */}
        <UsersTable />
      </main>
    </div>
  )
}
