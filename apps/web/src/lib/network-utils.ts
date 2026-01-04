import { Node, Edge, MarkerType } from 'reactflow'

export interface NetworkUser {
  id: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  image: string | null
  hometown: string | null
  referredById: string | null
  accountStatus: string
  paidEventYears?: number[]
}

export interface MemberNodeData {
  label: string
  image: string | null
  hometown: string | null
  depth: number
  accountStatus: string
  scale: number
  paidEventYears?: number[]
}

/**
 * Calculate optimal node size based on number of users
 */
function calculateNodeDimensions(userCount: number): {
  width: number
  height: number
  horizontalSpacing: number
  verticalSpacing: number
  scale: number
} {
  // Base dimensions for small networks (3-10 users)
  const BASE_WIDTH = 200
  const BASE_HEIGHT = 120

  // Scale factor based on user count
  let scale = 1.0

  if (userCount > 50) {
    scale = 0.6
  } else if (userCount > 30) {
    scale = 0.7
  } else if (userCount > 15) {
    scale = 0.85
  } else if (userCount <= 5) {
    scale = 1.2
  }

  return {
    width: BASE_WIDTH * scale,
    height: BASE_HEIGHT * scale,
    horizontalSpacing: 50 * scale,
    verticalSpacing: 150 * scale,
    scale,
  }
}

/**
 * Calculate the depth (level) of each user in the referral tree
 */
function calculateDepths(users: NetworkUser[]): Map<string, number> {
  const depthMap = new Map<string, number>()
  const userMap = new Map(users.map((u) => [u.id, u]))

  function getDepth(userId: string, visited = new Set<string>()): number {
    // Prevent infinite loops
    if (visited.has(userId)) return 0
    visited.add(userId)

    if (depthMap.has(userId)) {
      return depthMap.get(userId)!
    }

    const user = userMap.get(userId)
    if (!user || !user.referredById) {
      depthMap.set(userId, 0)
      return 0
    }

    const depth = getDepth(user.referredById, visited) + 1
    depthMap.set(userId, depth)
    return depth
  }

  users.forEach((user) => getDepth(user.id))
  return depthMap
}

/**
 * Calculate positions for nodes in a hierarchical layout
 */
function layoutNodes(
  users: NetworkUser[],
  depthMap: Map<string, number>,
  dimensions: { width: number; height: number; horizontalSpacing: number; verticalSpacing: number }
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const { width, height, horizontalSpacing, verticalSpacing } = dimensions

  // Group users by depth level
  const levelGroups = new Map<number, NetworkUser[]>()
  users.forEach((user) => {
    const depth = depthMap.get(user.id) || 0
    if (!levelGroups.has(depth)) {
      levelGroups.set(depth, [])
    }
    levelGroups.get(depth)!.push(user)
  })

  // Position nodes level by level
  const maxDepth = Math.max(...Array.from(depthMap.values()))

  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtLevel = levelGroups.get(depth) || []
    const levelWidth = nodesAtLevel.length * (width + horizontalSpacing)

    nodesAtLevel.forEach((user, index) => {
      const x = index * (width + horizontalSpacing) - levelWidth / 2
      const y = depth * (height + verticalSpacing)
      positions.set(user.id, { x, y })
    })
  }

  return positions
}

/**
 * Get display name for a user
 */
function getDisplayName(user: NetworkUser): string {
  if (user.displayName) return user.displayName
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.lastName) return user.lastName
  return 'Unknown User'
}

/**
 * Transform user data into React Flow nodes and edges
 */
export function buildNetworkGraph(users: NetworkUser[]): {
  nodes: Node<MemberNodeData>[]
  edges: Edge[]
} {
  if (users.length === 0) {
    return { nodes: [], edges: [] }
  }

  // Calculate optimal dimensions based on user count
  const dimensions = calculateNodeDimensions(users.length)

  const depthMap = calculateDepths(users)
  const positions = layoutNodes(users, depthMap, dimensions)

  // Create nodes with dynamic sizing
  const nodes: Node<MemberNodeData>[] = users.map((user) => {
    const position = positions.get(user.id) || { x: 0, y: 0 }
    const depth = depthMap.get(user.id) || 0

    return {
      id: user.id,
      type: 'member',
      position,
      data: {
        label: getDisplayName(user),
        image: user.image,
        hometown: user.hometown,
        depth,
        accountStatus: user.accountStatus,
        scale: dimensions.scale,
        paidEventYears: user.paidEventYears,
      },
    }
  })

  // Create edges with scaled stroke width
  const strokeWidth = Math.max(1.5, 2 * dimensions.scale)
  const edges: Edge[] = users
    .filter((user) => user.referredById)
    .map((user) => ({
      id: `${user.referredById}-${user.id}`,
      source: user.referredById!,
      target: user.id,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#94a3b8',
        strokeWidth,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
        width: 15 * dimensions.scale,
        height: 15 * dimensions.scale,
      },
    }))

  return { nodes, edges }
}

/**
 * Get color based on depth level
 */
export function getDepthColor(depth: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
  ]
  return colors[depth % colors.length]
}
