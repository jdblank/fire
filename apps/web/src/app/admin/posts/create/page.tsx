'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { hasRole } from '@/lib/utils'

interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export default function CreatePostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') return <div>Loading...</div>

  if (!session?.user || !hasRole(session.user, 'admin')) {
    return <div>Admin access required</div>
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingMedia(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'post')

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')

        const data = await response.json()
        return data.upload.url
      })

      const urls = await Promise.all(uploadPromises)
      setImages([...images, ...urls])
    } catch (error) {
      alert('Failed to upload images')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Auto-detect URLs in content with debouncing
  const handleContentChange = (newContent: string) => {
    setContent(newContent)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Debounce URL detection (wait 1 second after typing stops)
    debounceTimer.current = setTimeout(() => {
      // Find URLs in text
      const urlRegex = /(https?:\/\/[^\s]+)/gi
      const urls = newContent.match(urlRegex)

      if (urls && urls.length > 0) {
        const firstUrl = urls[0]
        // Only fetch preview if URL changed
        if (firstUrl !== detectedUrl) {
          setDetectedUrl(firstUrl)
          fetchPreviewForUrl(firstUrl)
        }
      } else if (detectedUrl) {
        // URL was removed
        setDetectedUrl(null)
        setLinkPreview(null)
      }
    }, 1000) // 1 second debounce
  }

  const fetchPreviewForUrl = async (url: string) => {
    setLoadingPreview(true)

    try {
      const response = await fetch('/api/posts/preview-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (response.ok && data.preview) {
        setLinkPreview(data.preview)
      } else {
        // Still show basic preview even if fetch failed
        setLinkPreview({ url, title: url })
      }
    } catch (error) {
      console.error('Preview error:', error)
      setLinkPreview({ url, title: url })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      alert('Please enter some content for your post')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          images,
          videos,
          linkUrl: linkPreview?.url,
          linkTitle: linkPreview?.title,
          linkDescription: linkPreview?.description,
          linkImage: linkPreview?.image,
        }),
      })

      if (response.ok) {
        alert('Post created successfully!')
        router.push('/dashboard')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Failed to create post: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">Create Post</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
        >
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What&apos;s on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share something with the community... (paste a link for automatic preview)"
              required
            />
            {loadingPreview && (
              <p className="text-sm text-blue-600 mt-2">Fetching link preview...</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingMedia}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-gray-100 file:text-gray-700
                hover:file:bg-gray-200
                file:cursor-pointer cursor-pointer"
            />
            {uploadingMedia && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Upload ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-32"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL (YouTube, Vimeo, etc.)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.target as HTMLInputElement
                    if (input.value) {
                      setVideos([...videos, input.value])
                      input.value = ''
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLButtonElement)
                    .previousElementSibling as HTMLInputElement
                  if (input.value) {
                    setVideos([...videos, input.value])
                    input.value = ''
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>

            {videos.length > 0 && (
              <div className="mt-3 space-y-2">
                {videos.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-gray-700 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link Preview - Auto-detected */}
          {linkPreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Preview</label>
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                {linkPreview.image && (
                  <div className="h-48 bg-gray-100">
                    <Image
                      src={linkPreview.image}
                      alt={linkPreview.title || 'Preview'}
                      width={600}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {linkPreview.title || linkPreview.url}
                  </h4>
                  {linkPreview.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{linkPreview.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {linkPreview.siteName || new URL(linkPreview.url).hostname}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLinkPreview(null)
                    setDetectedUrl(null)
                  }}
                  className="w-full py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
                >
                  Remove Link Preview
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Posting...' : 'Create Post'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
