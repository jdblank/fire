'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  sub: string
  name?: string
  email?: string
  picture?: string
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/user')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <img src={user.picture} alt={user.name || 'User'} className="h-8 w-8 rounded-full" />
          )}
          <span className="text-sm font-medium">{user.name || user.email || 'User'}</span>
        </div>
        <Link
          href="/api/auth/signout"
          className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
        >
          Sign Out
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
    >
      Sign In
    </Link>
  )
}
