import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Header } from '@/components/Header'
import { UserForm } from '../UserForm'

export default async function CreateUserPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Create New User
          </h1>
          <p className="text-gray-500">
            Fill out the user&apos;s profile information. They&apos;ll receive an invite to set their password.
          </p>
        </div>

        <UserForm />
      </main>
    </div>
  )
}
