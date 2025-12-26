import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage, validateImage } from '@/lib/upload-utils'
import { prisma } from '@fire/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate image
    const validation = validateImage(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to MinIO
    const folder = type === 'avatar' ? 'avatars' : 'uploads'
    const { key, url } = await uploadImage(buffer, file.name, file.type, folder)

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        filename: key,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        bucket: 'fire-uploads',
        key,
        uploadedBy: session.user.id,
      },
    })

    // For production, use proxied URL instead of direct MinIO URL
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    const displayUrl = isProduction 
      ? `${process.env.NEXTAUTH_URL}/api/images/${encodeURIComponent(key)}`
      : url

    // If it's an avatar, update user's image field with the display URL
    if (type === 'avatar') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: displayUrl },
      })
    }

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        url: displayUrl,
        filename: upload.filename,
      },
    })
  } catch (error) {
    console.error('Image upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      s3Config: {
        hasEndpoint: !!process.env.S3_ENDPOINT,
        hasBucket: !!process.env.S3_BUCKET,
        hasAccessKey: !!process.env.S3_ACCESS_KEY,
        hasSecretKey: !!process.env.S3_SECRET_KEY,
      }
    })
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


