'use client'

import { useState } from 'react'
import { ReferralNetworkGraph } from './ReferralNetworkGraph'
import { CommunityMobile } from './CommunityMobile'
import { NetworkUser } from '@/lib/network-utils'

interface CommunityViewToggleProps {
  users: NetworkUser[]
}

export function CommunityViewToggle({ users }: CommunityViewToggleProps) {
  const [view3D, setView3D] = useState(false)

  return (
    <div className="h-full relative">
      {/* Toggle Button - Fixed position */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setView3D(!view3D)}
          className={`px-4 py-2 rounded-lg font-medium shadow-lg transition-all ${
            view3D
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {view3D ? '← Back to 2D' : 'View 3D Graph (Beta) →'}
        </button>
      </div>

      {/* Conditional View Rendering */}
      {view3D ? <CommunityMobile users={users} /> : <ReferralNetworkGraph users={users} />}
    </div>
  )
}
