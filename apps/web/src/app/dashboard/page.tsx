import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { NewsFeed } from '@/components/NewsFeed'
import Link from 'next/link'
import { hasRole } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = hasRole(session.user, 'admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Latest News</h1>
            <p className="text-gray-500">Stay updated with the latest news and announcements</p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/posts/create"
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create Post
            </Link>
          )}
        </div>

        {/* News Feed */}
        <NewsFeed />
      </main>
    </div>
  )
}
