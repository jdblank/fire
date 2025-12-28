'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  role: string
  accountStatus: string
  createdAt: string
  referredBy?: {
    id: string
    email: string
    displayName: string | null
  } | null
  _count: {
    referrals: number
  }
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [search, statusFilter, pagination.page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (userId: string) => {
    if (!confirm('Generate a new invite link for this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/invite`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Copy invite URL to clipboard
        await navigator.clipboard.writeText(data.inviteUrl)
        alert(`Invite link copied to clipboard!\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}`)
        fetchUsers() // Refresh
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating invite:', error)
      alert('Failed to generate invite')
    }
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('User deleted successfully')
        fetchUsers() // Refresh
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING_INVITE: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      DEACTIVATED: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MODERATOR: 'bg-blue-100 text-blue-800',
      USER: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPagination({ ...pagination, page: 1 })
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPagination({ ...pagination, page: 1 })
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_INVITE">Pending Invite</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.displayName || `${user.firstName} ${user.lastName}`.trim() || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user.accountStatus)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.referredBy ? (
                      <Link href={`/admin/users/${user.referredBy.id}`} className="text-gray-900 hover:underline">
                        {user.referredBy.displayName || user.referredBy.email}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {user._count.referrals}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                      {user.accountStatus === 'PENDING_INVITE' && (
                        <button
                          onClick={() => handleInvite(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Invite
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
