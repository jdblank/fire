import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload'
import { prisma } from '@fire/db'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Fetch full user profile from DB (Server Side)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      hometown: true,
      dateOfBirth: true,
      mobilePhone: true,
      image: true,
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">My Profile</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Profile Photo */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
            <ProfilePhotoUpload
              currentImage={dbUser.image}
              // Photo upload is a client action handled inside the component
            />
          </div>

          {/* Profile Form (Need to convert this to a Client Component or keep logic here) */}
          <p className="text-gray-500 italic mb-4 text-sm">
            Note: Interactive profile editing is being updated. Please use the user settings or
            admin panel if immediate changes are needed.
          </p>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-900">
                  {dbUser.firstName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-900">
                  {dbUser.lastName}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-900">
                {dbUser.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
              <div className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-900">
                {dbUser.hometown || 'Not set'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
