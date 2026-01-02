'use client'

import { useState, useEffect } from 'react'

interface UserRoleManagerProps {
  userId: string
  logtoId: string | null
}

type Role = 'USER' | 'EDITOR' | 'ADMIN'

export function UserRoleManager({ userId, logtoId }: UserRoleManagerProps) {
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's current role from LogTo
  useEffect(() => {
    async function fetchRole() {
      if (!logtoId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/admin/users/${userId}/role`)
        if (response.ok) {
          const data = await response.json()
          const role = data.role as Role
          setCurrentRole(role)
          setSelectedRole(role)
        } else {
          setError('Failed to fetch user role')
        }
      } catch (err) {
        console.error('Error fetching role:', err)
        setError('Failed to fetch user role')
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [userId, logtoId])

  const handleSave = async () => {
    if (!selectedRole || selectedRole === currentRole) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: logtoId,
          role: selectedRole,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentRole(selectedRole)
        alert(data.message || 'Role updated successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      setError('Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Role</h2>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!logtoId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Role</h2>
        <p className="text-sm text-gray-500">
          User has not completed registration. Role can be set after they accept their invite.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">User Role</h2>
      <p className="text-sm text-gray-500 mb-4">
        Roles are managed in LogTo. Changes require the user to log out and back in to take effect.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Current Role: <span className="font-semibold text-gray-900">{currentRole}</span>
          </label>
          <select
            id="role"
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={saving}
          >
            <option value="USER">User</option>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {selectedRole && selectedRole !== currentRole && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Role'}
          </button>
        )}
      </div>
    </div>
  )
}
