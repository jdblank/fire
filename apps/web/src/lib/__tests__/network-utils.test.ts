import { describe, it, expect } from 'vitest'
import { buildNetworkGraph, getDepthColor } from '../network-utils'

describe('Network Utils', () => {
  describe('buildNetworkGraph', () => {
    it('should return empty arrays for no users', () => {
      const result = buildNetworkGraph([])
      
      expect(result.nodes).toEqual([])
      expect(result.edges).toEqual([])
    })

    it('should create nodes for single user', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          image: null,
          hometown: 'Austin',
          referredById: null,
          accountStatus: 'ACTIVE',
          paidEventYears: [2024, 2023]
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe('user1')
      expect(result.nodes[0].data.label).toBe('John Doe')
      expect(result.nodes[0].data.hometown).toBe('Austin')
      expect(result.nodes[0].data.depth).toBe(0)
      expect(result.nodes[0].data.paidEventYears).toEqual([2024, 2023])
      expect(result.edges).toHaveLength(0)
    })

    it('should create edge for referred user', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          image: null,
          hometown: 'Austin',
          referredById: null,
          accountStatus: 'ACTIVE'
        },
        {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          image: null,
          hometown: 'Brooklyn',
          referredById: 'user1',
          accountStatus: 'ACTIVE'
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes).toHaveLength(2)
      expect(result.edges).toHaveLength(1)
      expect(result.edges[0].source).toBe('user1')
      expect(result.edges[0].target).toBe('user2')
    })

    it('should calculate correct depths', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'Root',
          lastName: 'User',
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'ACTIVE'
        },
        {
          id: 'user2',
          firstName: 'Level',
          lastName: 'One',
          displayName: null,
          image: null,
          hometown: null,
          referredById: 'user1',
          accountStatus: 'ACTIVE'
        },
        {
          id: 'user3',
          firstName: 'Level',
          lastName: 'Two',
          displayName: null,
          image: null,
          hometown: null,
          referredById: 'user2',
          accountStatus: 'ACTIVE'
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes[0].data.depth).toBe(0) // Root
      expect(result.nodes[1].data.depth).toBe(1) // Level 1
      expect(result.nodes[2].data.depth).toBe(2) // Level 2
    })

    it('should use firstName + lastName when no displayName', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'ACTIVE'
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes[0].data.label).toBe('John Doe')
    })

    it('should handle missing names gracefully', () => {
      const users = [
        {
          id: 'user1',
          firstName: null,
          lastName: null,
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'ACTIVE'
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes[0].data.label).toBe('Unknown User')
    })

    it('should scale nodes for small networks', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'User',
          lastName: '1',
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'ACTIVE'
        }
      ]

      const result = buildNetworkGraph(users)

      // Small networks (<=5 users) should have 1.2x scale
      expect(result.nodes[0].data.scale).toBe(1.2)
    })

    it('should include accountStatus in node data', () => {
      const users = [
        {
          id: 'user1',
          firstName: 'Active',
          lastName: 'User',
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'ACTIVE'
        },
        {
          id: 'user2',
          firstName: 'Pending',
          lastName: 'User',
          displayName: null,
          image: null,
          hometown: null,
          referredById: null,
          accountStatus: 'PENDING_INVITE'
        }
      ]

      const result = buildNetworkGraph(users)

      expect(result.nodes[0].data.accountStatus).toBe('ACTIVE')
      expect(result.nodes[1].data.accountStatus).toBe('PENDING_INVITE')
    })
  })

  describe('getDepthColor', () => {
    it('should return colors for different depths', () => {
      const color0 = getDepthColor(0)
      const color1 = getDepthColor(1)
      const color2 = getDepthColor(2)

      expect(color0).toBeTruthy()
      expect(color1).toBeTruthy()
      expect(color2).toBeTruthy()
      expect(color0).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should cycle through colors for deep hierarchies', () => {
      const color0 = getDepthColor(0)
      const color6 = getDepthColor(6) // Should cycle back

      expect(color0).toBe(color6)
    })
  })
})

