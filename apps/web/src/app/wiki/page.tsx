import { auth } from "@/auth"
import { Header } from "@/components/Header"
import { redirect } from "next/navigation"

export default async function WikiPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={session.user} />
      
      {/* Coming Soon */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-8">
          <div className="mb-8">
            <svg
              className="w-20 h-20 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Wiki Coming Soon
            </h2>
            <p className="text-gray-600">
              We're working on bringing you collaborative documentation and community resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
