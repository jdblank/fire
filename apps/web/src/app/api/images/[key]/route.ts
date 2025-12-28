import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import { getSignedImageUrl } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: encodedKey } = await params
    // Check authentication
    const session = await auth()
    
    if (!session) {
      return new NextResponse('Unauthorized - Please sign in to view images', { status: 401 })
    }

    // Decode the key from URL
    const key = decodeURIComponent(encodedKey)
    
    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getSignedImageUrl(key)
    
    // Redirect to signed URL
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}
