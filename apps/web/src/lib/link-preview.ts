/**
 * Fetch Open Graph metadata from a URL for rich link previews
 * Note: For development, we'll use a fallback approach if fetching fails
 */

import https from 'https'

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Validate URL
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null
    }

    // Try fetching with node-fetch compatible options
    // Note: In Docker, external fetches may fail due to SSL issues
    const agent = new https.Agent({
      rejectUnauthorized: false // Disable SSL verification for development
    })

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // @ts-expect-error - agent is valid but TS doesn't know
      agent: url.startsWith('https') ? agent : undefined,
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      console.log('Link preview fetch failed:', response.status, url)
      // Return basic preview even if fetch failed
      return {
        url,
        title: urlObj.hostname,
        description: url,
      }
    }

    const html = await response.text()

    // Parse Open Graph tags
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1]
    const ogDescription = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1]
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1]
    const ogSiteName = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)?.[1]

    // Fallback to regular meta tags if OG not found
    const title = ogTitle || html.match(/<title>([^<]+)<\/title>/i)?.[1]
    const description = ogDescription || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]

    // Make image URL absolute if it's relative
    let imageUrl = ogImage
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).toString()
    }

    // Return preview with what we found
    const preview: LinkPreview = {
      url,
      title: title?.trim() || new URL(url).hostname,
      description: description?.trim(),
      image: imageUrl,
      siteName: ogSiteName?.trim(),
    }

    return preview
  } catch (error) {
    console.error('Error fetching link preview:', error)
    
    // Return basic preview even on error
    try {
      const urlObj = new URL(url)
      return {
        url,
        title: urlObj.hostname,
        description: 'Click to view',
      }
    } catch {
      return null
    }
  }
}
