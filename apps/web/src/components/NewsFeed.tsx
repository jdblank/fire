'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PostCard } from './PostCard'

export function NewsFeed() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (postId: string) => {
    // Remove post from state immediately for smooth UX
    setPosts(posts.filter((p) => p.id !== postId))
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 mb-2">No posts yet</p>
        <p className="text-sm text-gray-400">Check back soon for community updates!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isAdmin={isAdmin} onDelete={handleDelete} />
      ))}
    </div>
  )
}
