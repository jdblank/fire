'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MemberNodeData, getDepthColor } from '@/lib/network-utils'
import Link from 'next/link'

function MemberCardComponent({ data, id }: NodeProps<MemberNodeData>) {
  const { label, image, hometown, depth, accountStatus, scale, paidEventYears } = data
  const borderColor = getDepthColor(depth)
  const isPending = accountStatus === 'PENDING_INVITE'

  // Dynamic sizing based on scale
  const cardWidth = 180 * scale
  const avatarSize = 64 * scale
  const fontSize = 14 * scale
  const smallFontSize = 12 * scale
  const badgeFontSize = 10 * scale
  const padding = 16 * scale

  // Get initials from label
  const getInitials = (name: string): string => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Link
      href={`/users/${id}`}
      className="bg-white rounded-lg shadow-md border-2 hover:shadow-xl transition-shadow duration-200 relative block cursor-pointer"
      style={{
        width: `${cardWidth}px`,
        borderColor,
        borderStyle: isPending ? 'dashed' : 'solid',
        opacity: isPending ? 0.75 : 1,
      }}
    >
      {/* Pending Badge */}
      {isPending && (
        <div
          className="absolute bg-amber-100 text-amber-700 rounded font-medium"
          style={{
            top: `${2 * scale}px`,
            right: `${2 * scale}px`,
            fontSize: `${badgeFontSize}px`,
            padding: `${2 * scale}px ${6 * scale}px`,
          }}
        >
          Pending
        </div>
      )}

      {/* Input Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: `${12 * scale}px`,
          height: `${12 * scale}px`,
          backgroundColor: '#9ca3af',
        }}
      />

      {/* Card Content */}
      <div className="flex flex-col items-center text-center" style={{ padding: `${padding}px` }}>
        {/* Avatar */}
        <div style={{ marginBottom: `${12 * scale}px` }}>
          {image ? (
            <img
              src={image}
              alt={label}
              className="rounded-full object-cover border-2 border-gray-200"
              style={{
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
              }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
                backgroundColor: borderColor,
                fontSize: `${fontSize * 1.2}px`,
              }}
            >
              {getInitials(label)}
            </div>
          )}
        </div>

        {/* Name */}
        <h3
          className="font-semibold text-gray-900 line-clamp-2"
          style={{
            fontSize: `${fontSize}px`,
            marginBottom: `${4 * scale}px`,
          }}
        >
          {label}
        </h3>

        {/* Hometown */}
        {hometown && (
          <p className="text-gray-500 line-clamp-1" style={{ fontSize: `${smallFontSize}px` }}>
            📍 {hometown}
          </p>
        )}

        {/* Paid Event Years */}
        {paidEventYears && paidEventYears.length > 0 && (
          <div
            className="flex flex-wrap gap-1 justify-center"
            style={{ marginTop: `${4 * scale}px` }}
          >
            {paidEventYears.map((year) => (
              <span
                key={year}
                className="bg-blue-100 text-blue-700 rounded font-medium"
                style={{
                  fontSize: `${badgeFontSize}px`,
                  padding: `${2 * scale}px ${4 * scale}px`,
                }}
              >
                {year}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Output Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: `${12 * scale}px`,
          height: `${12 * scale}px`,
          backgroundColor: '#9ca3af',
        }}
      />
    </Link>
  )
}

export const MemberCard = memo(MemberCardComponent)
