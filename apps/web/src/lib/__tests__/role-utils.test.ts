import { describe, it, expect } from 'vitest'
import { hasRole } from '../utils'

describe('hasRole', () => {
  it('should return true when user has the specified role', () => {
    const user = { roles: ['admin', 'user'] }
    expect(hasRole(user, 'admin')).toBe(true)
  })

  it('should return false when user does not have the specified role', () => {
    const user = { roles: ['user'] }
    expect(hasRole(user, 'admin')).toBe(false)
  })

  it('should return false for null user', () => {
    expect(hasRole(null, 'admin')).toBe(false)
  })

  it('should return false for undefined user', () => {
    expect(hasRole(undefined, 'admin')).toBe(false)
  })

  it('should return false when user has no roles property', () => {
    const user = {}
    expect(hasRole(user, 'admin')).toBe(false)
  })

  it('should return false when user roles array is undefined', () => {
    const user = { roles: undefined }
    expect(hasRole(user, 'admin')).toBe(false)
  })

  it('should return false when user roles array is empty', () => {
    const user = { roles: [] }
    expect(hasRole(user, 'admin')).toBe(false)
  })

  it('should handle multiple roles correctly', () => {
    const user = { roles: ['user', 'moderator', 'admin'] }
    expect(hasRole(user, 'user')).toBe(true)
    expect(hasRole(user, 'moderator')).toBe(true)
    expect(hasRole(user, 'admin')).toBe(true)
    expect(hasRole(user, 'superadmin')).toBe(false)
  })

  it('should be case-sensitive', () => {
    const user = { roles: ['admin'] }
    expect(hasRole(user, 'admin')).toBe(true)
    expect(hasRole(user, 'Admin')).toBe(false)
    expect(hasRole(user, 'ADMIN')).toBe(false)
  })

  it('should handle exact role name matching', () => {
    const user = { roles: ['user'] }
    expect(hasRole(user, 'user')).toBe(true)
    expect(hasRole(user, 'users')).toBe(false)
    expect(hasRole(user, 'use')).toBe(false)
  })
})
