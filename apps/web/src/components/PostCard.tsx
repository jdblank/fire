'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface Post {
  id: string
  content: string
  images: string[]
  videos: string[]
  linkUrl?: string | null
  linkTitle?: string | null
  linkDescription?: string | null
  linkImage?: string | null
  likes: number
  dislikes: number
  isPinned: boolean
  userReaction?: 'like' | 'dislike' | null
  createdAt: Date | string
  author: {
    id: string
    displayName?: string | null
    firstName?: string | null
    lastName?: string | null
    image?: string | null
  }
  _count?: {
    comments: number
  }
}

interface PostCardProps {
  post: Post
  isAdmin?: boolean
  onDelete?: (postId: string) => void
}

export function PostCard({ post, isAdmin, onDelete }: PostCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(post.userReaction || null)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [dislikeCount, setDislikeCount] = useState(post.dislikes)
  const [reacting, setReacting] = useState(false)

  const authorName = post.author.displayName || 
    `${post.author.firstName} ${post.author.lastName}`.trim() || 
    'Unknown User'

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/posts?id=${post.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (onDelete) {
          onDelete(post.id)
        } else {
          window.location.reload()
        }
      } else {
        alert('Failed to delete post')
      }
    } catch (error) {
      alert('Error deleting post')
    } finally {
      setDeleting(false)
    }
  }

  const handleReaction = async (isLike: boolean) => {
    if (reacting) return

    setReacting(true)
    const previousReaction = reaction
    const previousLikes = likeCount
    const previousDislikes = dislikeCount

    // Optimistic update
    if (reaction === (isLike ? 'like' : 'dislike')) {
      // Clicking same button = remove reaction
      setReaction(null)
      if (isLike) {
        setLikeCount(likeCount - 1)
      } else {
        setDislikeCount(dislikeCount - 1)
      }
    } else if (reaction === null) {
      // No reaction yet = add new reaction
      setReaction(isLike ? 'like' : 'dislike')
      if (isLike) {
        setLikeCount(likeCount + 1)
      } else {
        setDislikeCount(dislikeCount + 1)
      }
    } else {
      // Switching reactions
      setReaction(isLike ? 'like' : 'dislike')
      if (isLike) {
        setLikeCount(likeCount + 1)
        setDislikeCount(dislikeCount - 1)
      } else {
        setLikeCount(likeCount - 1)
        setDislikeCount(dislikeCount + 1)
      }
    }

    try {
      const shouldDelete = reaction === (isLike ? 'like' : 'dislike')
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: shouldDelete ? 'DELETE' : 'POST',
        headers: shouldDelete ? {} : { 'Content-Type': 'application/json' },
        body: shouldDelete ? undefined : JSON.stringify({ isLike }),
      })

      if (!response.ok) {
        // Revert on error
        setReaction(previousReaction)
        setLikeCount(previousLikes)
        setDislikeCount(previousDislikes)
      }
    } catch (error) {
      // Revert on error
      setReaction(previousReaction)
      setLikeCount(previousLikes)
      setDislikeCount(previousDislikes)
    } finally {
      setReacting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Link href={`/users/${post.author.id}`}>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={authorName}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link 
            href={`/users/${post.author.id}`}
            className="font-semibold text-gray-900 hover:text-blue-600"
          >
            {authorName}
          </Link>
          <p className="text-sm text-gray-500">{timeAgo}</p>
          {post.isPinned && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
              Pinned
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {/* If there's a link preview, hide the URL from content */}
        <p className="text-gray-900 whitespace-pre-wrap">
          {post.linkUrl 
            ? post.content.replace(post.linkUrl, '').trim()
            : post.content
          }
        </p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`mb-4 grid gap-2 ${
          post.images.length === 1 ? 'grid-cols-1' : 
          post.images.length === 2 ? 'grid-cols-2' : 
          'grid-cols-2'
        }`}>
          {post.images.map((url, index) => (
            <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {post.videos && post.videos.length > 0 && (
        <div className="mb-4 space-y-3">
          {post.videos.map((url, index) => (
            <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {url.includes('youtube.com') || url.includes('youtu.be') ? (
                <iframe
                  src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : url.includes('vimeo.com') ? (
                <iframe
                  src={url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={url} controls className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link Preview */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors bg-gray-50"
        >
          {post.linkImage && (
            <div className="h-64 bg-gray-100">
              <Image
                src={post.linkImage}
                alt={post.linkTitle || 'Link preview'}
                width={800}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1 hover:text-blue-600">
                  {post.linkTitle || new URL(post.linkUrl).hostname}
                </h4>
                {post.linkDescription && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                    {post.linkDescription}
                  </p>
                )}
                <p className="text-xs text-gray-500 uppercase font-medium">
                  🔗 {new URL(post.linkUrl).hostname}
                </p>
              </div>
            </div>
          </div>
        </a>
      )}

      {/* Footer - Thumbs Up/Down */}
      <div className="flex items-center gap-4 text-sm pt-3 border-t border-gray-100">
        {/* Thumbs Up */}
        <button 
          onClick={() => handleReaction(true)}
          disabled={reacting}
          className={`flex items-center gap-2 transition-colors ${
            reaction === 'like' 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <svg 
            className={`w-5 h-5 ${reaction === 'like' ? 'fill-current' : ''}`} 
            fill={reaction === 'like' ? 'currentColor' : 'none'}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={reaction === 'like' ? 0 : 2} 
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
            />
          </svg>
          <span className="font-medium">{likeCount}</span>
        </button>

        {/* Thumbs Down */}
        <button 
          onClick={() => handleReaction(false)}
          disabled={reacting}
          className={`flex items-center gap-2 transition-colors ${
            reaction === 'dislike' 
              ? 'text-red-600' 
              : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <svg 
            className={`w-5 h-5 ${reaction === 'dislike' ? 'fill-current' : ''}`} 
            fill={reaction === 'dislike' ? 'currentColor' : 'none'}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={reaction === 'dislike' ? 0 : 2} 
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
            />
          </svg>
          <span className="font-medium">{dislikeCount}</span>
        </button>
      </div>
    </div>
  )
}

