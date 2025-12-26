import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchLinkPreview } from '@/lib/link-preview'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch preview
    const preview = await fetchLinkPreview(url)

    // Always return something useful, even if preview failed
    if (!preview) {
      return NextResponse.json({ 
        preview: {
          url,
          title: new URL(url).hostname,
          description: 'Click to view'
        }
      })
    }

    return NextResponse.json({ preview })

  } catch (error) {
    console.error('Link preview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    )
  }
}

