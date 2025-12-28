'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UserRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      setMessage('Role updated successfully!')
      router.refresh()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          disabled={loading}
        >
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium text-gray-700">Role Permissions:</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          {role === 'USER' && (
            <>
              <li>View and create posts</li>
              <li>Register for events</li>
              <li>Access community features</li>
            </>
          )}
          {role === 'MODERATOR' && (
            <>
              <li>All user permissions</li>
              <li>Moderate posts and comments</li>
              <li>Manage events</li>
            </>
          )}
          {role === 'ADMIN' && (
            <>
              <li>All moderator permissions</li>
              <li>Manage user roles</li>
              <li>Access admin panel</li>
              <li>Full platform control</li>
            </>
          )}
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading || role === currentRole}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Updating...' : 'Update Role'}
      </button>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.startsWith('Error') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {role !== currentRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ You are about to change this user&apos;s role from <strong>{currentRole}</strong> to <strong>{role}</strong>
          </p>
        </div>
      )}
    </form>
  )
}
