import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSignedImageUrl } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse('Unauthorized - Please sign in to view images', { status: 401 })
    }

    // Decode the key from URL
    const key = decodeURIComponent(params.key)
    
    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getSignedImageUrl(key)
    
    // Redirect to signed URL
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}

