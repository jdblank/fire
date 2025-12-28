'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    role?: string
    image?: string | null
  }
}

export function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    // Proper OIDC logout flow
    // Get session to retrieve id_token
    const session = await fetch('/api/auth/session').then((r) => r.json())

    if (session?.id_token) {
      // Clear Fire session first
      await signOut({ redirect: false })

      // Then call LogTo's end_session with id_token_hint for auto-redirect
      const isDev =
        window.location.hostname === 'app.fire.local' || window.location.hostname === 'localhost'
      const logtoEndpoint =
        process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ||
        (isDev ? 'http://localhost:3001' : 'https://auth.lemonade.art')
      const params = new URLSearchParams({
        id_token_hint: session.id_token,
        post_logout_redirect_uri: window.location.origin,
      })
      window.location.href = `${logtoEndpoint}/oidc/session/end?${params}`
    } else {
      // Fallback: just sign out from Fire
      await signOut({ callbackUrl: '/' })
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Fire
          </Link>

          {/* Navigation - Only shown when logged in */}
          {user && (
            <nav className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/events"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Events
              </Link>
              <Link
                href="/community"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Community
              </Link>
              <Link
                href="/wiki"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Wiki
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {user.name?.charAt(0)?.toUpperCase() ||
                          user.email?.charAt(0)?.toUpperCase() ||
                          'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline font-medium">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {user.role}
                        </span>
                      )}
                    </div>

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Settings
                    </Link>

                    {user.role === 'ADMIN' && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          href="/admin/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Users
                        </Link>
                        <Link
                          href="/admin/events"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Events
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
