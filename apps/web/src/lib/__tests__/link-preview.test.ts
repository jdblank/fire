import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Link Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchLinkPreview', () => {
    it('should extract Open Graph metadata', async () => {
      const mockHTML = `
        <html>
          <head>
            <meta property="og:title" content="Test Article" />
            <meta property="og:description" content="This is a test article" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta property="og:site_name" content="Example Site" />
          </head>
        </html>
      `

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHTML,
      })

      const { fetchLinkPreview } = await import('../link-preview')
      const result = await fetchLinkPreview('https://example.com/article')

      expect(result).toEqual({
        url: 'https://example.com/article',
        title: 'Test Article',
        description: 'This is a test article',
        image: 'https://example.com/image.jpg',
        siteName: 'Example Site',
      })
    })

    it('should fallback to regular title tag if no OG tags', async () => {
      const mockHTML = '<html><head><title>Page Title</title></head></html>'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHTML,
      })

      const { fetchLinkPreview } = await import('../link-preview')
      const result = await fetchLinkPreview('https://example.com')

      expect(result?.title).toBe('Page Title')
    })

    it('should handle fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { fetchLinkPreview } = await import('../link-preview')
      const result = await fetchLinkPreview('https://example.com')

      expect(result).toEqual({
        url: 'https://example.com',
        title: 'example.com',
        description: 'Click to view',
      })
    })

    it('should reject non-http protocols', async () => {
      const { fetchLinkPreview } = await import('../link-preview')
      const result = await fetchLinkPreview('javascript:alert(1)')

      expect(result).toBeNull()
    })

    it('should handle relative image URLs', async () => {
      const mockHTML = '<meta property="og:image" content="/images/preview.jpg" />'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHTML,
      })

      const { fetchLinkPreview } = await import('../link-preview')
      const result = await fetchLinkPreview('https://example.com/article')

      expect(result?.image).toBe('https://example.com/images/preview.jpg')
    })
  })
})
