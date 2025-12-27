import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { prisma } from '@fire/db'
import Image from 'next/image'
import Link from 'next/link'
import { formatDateShort } from '@/lib/date-utils'

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      profile: true,
      referredBy: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
      referrals: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          image: true,
        },
        where: {
          accountStatus: 'ACTIVE',
        },
      },
      eventRegistrations: {
        where: {
          status: 'CONFIRMED',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              eventType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session.user} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            User not found
          </div>
        </main>
      </div>
    )
  }

  const displayName = user.displayName || `${user.firstName} ${user.lastName}`.trim() || 'User'
  const isOwnProfile = session.user.id === user.id
  const isPublic = user.profile?.isPublic ?? true

  // If not public and not own profile, show message
  if (!isPublic && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={session.user} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            This profile is private
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.image ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                  <Image
                    src={user.image}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold text-gray-900">
                  {displayName}
                </h1>
                {isOwnProfile && (
                  <Link
                    href="/profile"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              {user.hometown && (
                <p className="text-gray-600 mb-3">
                  📍 {user.hometown}
                </p>
              )}

              {user.profile?.bio && (
                <p className="text-gray-700 mb-4">
                  {user.profile.bio}
                </p>
              )}

              {/* Social Links */}
              {(user.profile?.twitter || user.profile?.github || user.profile?.linkedin) && (
                <div className="flex gap-3 mt-4">
                  {user.profile.twitter && (
                    <a
                      href={`https://twitter.com/${user.profile.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-500"
                    >
                      Twitter
                    </a>
                  )}
                  {user.profile.github && (
                    <a
                      href={`https://github.com/${user.profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      GitHub
                    </a>
                  )}
                  {user.profile.linkedin && (
                    <a
                      href={user.profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-700"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Referral Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Network
            </h2>
            
            {user.referredBy && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Referred by:</p>
                <Link
                  href={`/users/${user.referredBy.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {user.referredBy.displayName || `${user.referredBy.firstName} ${user.referredBy.lastName}`}
                </Link>
              </div>
            )}

            {user.referrals.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Referred members ({user.referrals.length}):</p>
                <div className="space-y-2">
                  {user.referrals.slice(0, 5).map((referral) => (
                    <Link
                      key={referral.id}
                      href={`/users/${referral.id}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      {referral.image ? (
                        <Image
                          src={referral.image}
                          alt={referral.displayName || 'User'}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                      )}
                      <span className="text-sm">
                        {referral.displayName || `${referral.firstName} ${referral.lastName}`}
                      </span>
                    </Link>
                  ))}
                  {user.referrals.length > 5 && (
                    <p className="text-xs text-gray-500">
                      and {user.referrals.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {!user.referredBy && user.referrals.length === 0 && (
              <p className="text-gray-500 text-sm">No referral activity yet</p>
            )}
          </div>

          {/* Event History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Events Attended
            </h2>
            
            {user.eventRegistrations.length > 0 ? (
              <div className="space-y-3">
                {user.eventRegistrations.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                    <Link
                      href={`/events/${reg.event.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      {reg.event.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateShort(reg.event.startDate)}
                      {reg.event.eventType === 'PAID' && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                          PAID
                        </span>
                      )}
                    </p>
                  </div>
                ))}
                {user.eventRegistrations.length > 5 && (
                  <p className="text-xs text-gray-500 pt-2">
                    and {user.eventRegistrations.length - 5} more events...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No events attended yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
