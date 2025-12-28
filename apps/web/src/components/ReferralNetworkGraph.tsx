'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { MemberCard } from './MemberCard'
import { NetworkUser, buildNetworkGraph, MemberNodeData } from '@/lib/network-utils'

interface ReferralNetworkGraphProps {
  users: NetworkUser[]
}

// Define nodeTypes outside component to prevent recreation on each render
const nodeTypes: NodeTypes = {
  member: MemberCard,
} as const

export function ReferralNetworkGraph({ users }: ReferralNetworkGraphProps) {
  // Build the graph structure
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNetworkGraph(users),
    [users]
  )

  const [nodes, , onNodesChange] = useNodesState<Node<MemberNodeData>>(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initialEdges)

  // Minimap node color based on depth
  const getMiniMapNodeColor = useCallback((node: Node<MemberNodeData>) => {
    return node.data.depth === 0 ? '#3b82f6' : '#94a3b8'
  }, [])

  // Empty state
  if (users.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Network Members Yet</h3>
          <p className="text-gray-600">Start inviting members to build your referral network</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f9fafb',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls
          showInteractive={false}
          className="bg-white border border-gray-300 rounded-lg shadow-lg"
        />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          className="bg-white border border-gray-300 rounded-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>
    </div>
  )
}
