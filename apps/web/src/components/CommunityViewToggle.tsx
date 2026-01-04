'use client'

import { useState, useEffect } from 'react'
import { ReferralNetworkGraph } from './ReferralNetworkGraph'
import { CommunityMobile } from './CommunityMobile'
import { NetworkUser } from '@/lib/network-utils'

interface CommunityViewToggleProps {
  users: NetworkUser[]
}

export function CommunityViewToggle({ users }: CommunityViewToggleProps) {
  const [view3D, setView3D] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Keyboard shortcut: Press "T" to toggle 3D view
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if "T" key is pressed (case insensitive)
      // Ignore if user is typing in an input/textarea
      if (
        (event.key === 't' || event.key === 'T') &&
        !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
      ) {
        setView3D((prev) => {
          const newValue = !prev
          // Show toast notification
          setShowToast(true)
          setTimeout(() => setShowToast(false), 2000)
          return newValue
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="h-full relative">
      {/* Toast Notification - Appears when view switches */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{view3D ? '🌳' : '📊'}</span>
            <span className="font-medium">
              {view3D ? '3D Tree View' : '2D Graph View'}
            </span>
          </div>
        </div>
      )}

      {/* Conditional View Rendering */}
      {view3D ? <CommunityMobile users={users} /> : <ReferralNetworkGraph users={users} />}
    </div>
  )
}
