'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { NetworkUser } from '@/lib/network-utils'
import { ErrorBoundary } from './ErrorBoundary'

// CRITICAL: SSR-safe import - prevents "window is not defined" errors
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Loading 3D View...</div>
    </div>
  ),
})

interface CommunityMobileProps {
  users: NetworkUser[]
}

interface GraphNode {
  id: string
  name: string
  image: string | null
  hometown: string | null
  paidYears: string[]
  depth: number
  color: string
  children?: string[] // IDs of direct children
}

interface GraphLink {
  source: string
  target: string
}

interface UserCardData {
  name: string
  hometown: string | null
  paidYears: string[]
}

// Depth-based color palette
const DEPTH_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
]

function getDepthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length]
}

function getDisplayName(user: NetworkUser): string {
  if (user.displayName) return user.displayName
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.lastName) return user.lastName
  return 'Unknown User'
}

// Helper: Get pruned tree based on collapsed nodes
function getPrunedTree(
  allNodes: GraphNode[],
  allLinks: GraphLink[],
  collapsedIds: Set<string>
): { nodes: GraphNode[]; links: GraphLink[] } {
  // Find which nodes to exclude (descendants of collapsed nodes)
  const excludedIds = new Set<string>()

  function markDescendants(nodeId: string) {
    const children = allLinks.filter((l) => l.source === nodeId).map((l) => l.target)
    children.forEach((childId) => {
      excludedIds.add(childId)
      markDescendants(childId) // Recursively exclude all descendants
    })
  }

  // Mark descendants of all collapsed nodes
  collapsedIds.forEach((id) => {
    markDescendants(id)
  })

  // Filter nodes and links
  const visibleNodes = allNodes.filter((n) => !excludedIds.has(n.id))
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleLinks = allLinks.filter(
    (l) => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target)
  )

  return { nodes: visibleNodes, links: visibleLinks }
}

export function CommunityMobile({ users }: CommunityMobileProps) {
  const graphRef = useRef<any>(null)
  const [selectedUser, setSelectedUser] = useState<UserCardData | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate user depths in the referral tree
  const depthMap = useMemo(() => {
    const depths = new Map<string, number>()
    const userMap = new Map(users.map((u) => [u.id, u]))

    function getDepth(userId: string, visited = new Set<string>()): number {
      if (visited.has(userId)) return 0
      visited.add(userId)

      if (depths.has(userId)) return depths.get(userId)!

      const user = userMap.get(userId)
      if (!user || !user.referredById) {
        depths.set(userId, 0)
        return 0
      }

      const depth = getDepth(user.referredById, visited) + 1
      depths.set(userId, depth)
      return depth
    }

    users.forEach((user) => getDepth(user.id))
    return depths
  }, [users])

  // Transform data into full graph format (all nodes)
  const fullGraphData = useMemo(() => {
    const nodes: GraphNode[] = users.map((user) => {
      const depth = depthMap.get(user.id) || 0
      const paidYears = (user.paidEventYears || []).map(String).sort((a, b) => b.localeCompare(a))

      return {
        id: user.id,
        name: getDisplayName(user),
        image: user.image,
        hometown: user.hometown,
        paidYears,
        depth,
        color: getDepthColor(depth),
      }
    })

    const links: GraphLink[] = users
      .filter((user) => user.referredById)
      .map((user) => ({
        source: user.referredById!,
        target: user.id,
      }))

    // Calculate children for each node
    const childrenMap = new Map<string, string[]>()
    links.forEach((link) => {
      if (!childrenMap.has(link.source)) {
        childrenMap.set(link.source, [])
      }
      childrenMap.get(link.source)!.push(link.target)
    })

    nodes.forEach((node) => {
      node.children = childrenMap.get(node.id) || []
    })

    return { nodes, links }
  }, [users, depthMap])

  // Initialize collapsed state: Collapse all except root's direct children
  useEffect(() => {
    if (fullGraphData.nodes.length === 0) return

    // Find root nodes (nodes with no parent)
    const rootNodes = fullGraphData.nodes.filter((node) => node.depth === 0)

    // Get direct children of root
    const directChildren = new Set<string>()
    rootNodes.forEach((root) => {
      if (root.children) {
        root.children.forEach((childId) => directChildren.add(childId))
      }
    })

    // Collapse all nodes that are NOT root and NOT direct children of root
    const initialCollapsed = new Set<string>()
    fullGraphData.nodes.forEach((node) => {
      if (node.depth > 1) {
        // This is a grandchild or deeper - collapse its parent
        const parent = fullGraphData.nodes.find((n) => n.children?.includes(node.id))
        if (parent && parent.depth === 1) {
          initialCollapsed.add(parent.id)
        }
      }
    })

    setCollapsedNodes(initialCollapsed)
  }, [fullGraphData])

  // Get pruned tree based on collapsed state
  const graphData = useMemo(() => {
    return getPrunedTree(fullGraphData.nodes, fullGraphData.links, collapsedNodes)
  }, [fullGraphData, collapsedNodes])

  // Check WebGL availability on mount
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas')
        const gl =
          canvas.getContext('webgl') ||
          canvas.getContext('webgl2') ||
          canvas.getContext('experimental-webgl')

        return !!gl
      } catch (e) {
        console.error('[WebGL Check] Error:', e)
        return false
      }
    }

    const result = checkWebGL()
    setWebglAvailable(result)
  }, [])

  // Handle responsive sizing
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({ width: clientWidth, height: clientHeight })
      }
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // Configure forces and initial camera position
  useEffect(() => {
    if (!graphRef.current) return

    // Wait for graph to be ready
    const timer = setTimeout(() => {
      if (graphRef.current) {
        // Configure forces for "Hanging Mobile" feel
        const linkForce = graphRef.current.d3Force('link')
        if (linkForce) {
          linkForce.distance(50) // Tight connections
        }

        const chargeForce = graphRef.current.d3Force('charge')
        if (chargeForce) {
          chargeForce.strength(-300) // Strong repulsion to prevent clumping
        }

        // Add center force to keep graph centered
        const centerForce = graphRef.current.d3Force('center')
        if (centerForce) {
          centerForce.x(0).y(0).z(0)
        }
      }
    }, 100)

    // After warmup, zoom to fit all nodes with padding
    const fitTimer = setTimeout(() => {
      if (graphRef.current && graphRef.current.zoomToFit) {
        graphRef.current.zoomToFit(400, 50) // 400ms animation, 50px padding
      }
    }, 1500) // Wait for warmup to complete

    return () => {
      clearTimeout(timer)
      clearTimeout(fitTimer)
    }
  }, [graphData])

  // Handle node click - Toggle expand/collapse and focus
  const handleNodeClick = useCallback(
    (node: any) => {
      // Toggle collapse state if node has children
      const fullNode = fullGraphData.nodes.find((n) => n.id === node.id)
      if (fullNode && fullNode.children && fullNode.children.length > 0) {
        setCollapsedNodes((prev) => {
          const next = new Set(prev)
          if (next.has(node.id)) {
            next.delete(node.id) // Expand
          } else {
            next.add(node.id) // Collapse
          }
          return next
        })
      }

      // After any click, zoom to fit all visible nodes
      // This ensures we see the clicked node and its tree
      setTimeout(() => {
        if (graphRef.current && graphRef.current.zoomToFit) {
          graphRef.current.zoomToFit(800, 80) // 800ms animation, 80px padding
        }
      }, 100)

      // Show user card
      setSelectedUser({
        name: node.name,
        hometown: node.hometown,
        paidYears: node.paidYears,
      })
    },
    [fullGraphData]
  )

  // Create 3D sphere node with floating text label ("Planet & Satellite")
  const nodeThreeObject = useCallback((node: any) => {
    // Create sphere geometry (radius 6 for safe starting size)
    const geometry = new THREE.SphereGeometry(6, 32, 32)

    // Create material with texture or color
    let material: any

    if (node.image) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.crossOrigin = 'anonymous'

      const texture = textureLoader.load(node.image, undefined, undefined, (err: any) => {
        console.error(`[3D Node] ✗ Failed to load texture for ${node.name}`, err)
        // Fallback to color
        if (mesh.material) {
          mesh.material = new THREE.MeshBasicMaterial({ color: node.color })
        }
      })

      material = new THREE.MeshBasicMaterial({ map: texture })
    } else {
      // Solid color sphere
      material = new THREE.MeshBasicMaterial({ color: node.color })
    }

    const mesh = new THREE.Mesh(geometry, material)

    // Create floating text label as child sprite ("Satellite")
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 512
      canvas.height = 128

      // Transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw bold black text
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.name, canvas.width / 2, canvas.height / 2)

      // Create label sprite
      const labelTexture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
      })
      const labelSprite = new THREE.Sprite(labelMaterial)

      // Position label below sphere (y: -12 to hang below)
      labelSprite.scale.set(16, 4, 1) // Wide enough to read
      labelSprite.position.set(0, -12, 0)

      // Add label as child so it moves with the sphere
      mesh.add(labelSprite)
    }

    return mesh
  }, [])

  return (
    <ErrorBoundary>
      <div ref={containerRef} className="relative w-full h-full bg-slate-50">
        {/* WebGL Not Available Fallback */}
        {webglAvailable === false && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
              <div className="text-2xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">3D View Unavailable</h3>
              <p className="text-gray-300 mb-4">
                WebGL is not available in your environment. This usually happens in containerized
                environments without GPU access.
              </p>
              <p className="text-sm text-gray-400">
                The 3D visualization requires WebGL/GPU support. Please use the 2D view instead or
                try accessing this page on a device with GPU acceleration.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {webglAvailable === null && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Checking WebGL support...</div>
          </div>
        )}

        {/* 3D Graph - Only render if WebGL is available */}
        {webglAvailable === true && dimensions.width > 0 && dimensions.height > 0 && (
          <ForceGraph3D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#f8fafc"
            nodeLabel={(node: any) => node.name}
            nodeThreeObject={nodeThreeObject}
            nodeOpacity={1.0}
            linkColor={() => '#94a3b8'}
            linkOpacity={0.6}
            linkWidth={1}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={() => '#60a5fa'}
            onNodeClick={handleNodeClick}
            dagMode="td"
            dagLevelDistance={100}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.15}
            warmupTicks={100}
            cooldownTicks={0}
          />
        )}

        {/* User Card - appears at bottom center when node is clicked */}
        {selectedUser && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white shadow-xl rounded-xl p-4 border border-slate-100 max-w-sm w-11/12 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-slate-900 text-lg">{selectedUser.name}</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded"
              >
                ✕
              </button>
            </div>
            {selectedUser.hometown && (
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                <span>📍</span>
                <span>{selectedUser.hometown}</span>
              </p>
            )}
            {selectedUser.paidYears.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Events:</span>
                {selectedUser.paidYears.map((year) => (
                  <span
                    key={year}
                    className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm"
                  >
                    {year}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint Text */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-600 shadow-sm">
          Click nodes to expand/collapse branches
        </div>
      </div>
    </ErrorBoundary>
  )
}
