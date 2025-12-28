import { S3 } from 'aws-sdk'

// Lazy initialization to ensure env vars are read at runtime
let s3ClientInstance: S3 | null = null

function getS3Client(): S3 {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9100',
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
      region: process.env.S3_REGION || 'us-east-1',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    })
  }
  return s3ClientInstance
}

function getBucketName(): string {
  return process.env.S3_BUCKET || 'fire-uploads'
}

function getPublicUrl(): string {
  return process.env.S3_PUBLIC_URL || 'http://localhost:9100/fire-uploads'
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`,
    }
  }

  return { valid: true }
}

/**
 * Upload image to MinIO
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string = 'avatars'
): Promise<{ key: string; url: string }> {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = filename.split('.').pop()
  const key = `${folder}/${timestamp}-${randomString}.${extension}`

  const s3Client = getS3Client()
  const bucketName = getBucketName()
  
  await s3Client
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Note: ACL removed - bucket is already configured for public access via minio-init
    })
    .promise()

  const url = `${getPublicUrl()}/${key}`

  return { key, url }
}

/**
 * Delete image from MinIO
 */
export async function deleteImage(key: string): Promise<void> {
  const s3Client = getS3Client()
  await s3Client
    .deleteObject({
      Bucket: getBucketName(),
      Key: key,
    })
    .promise()
}

/**
 * Get signed URL for secure image access (expires in 1 hour)
 */
export async function getSignedImageUrl(key: string): Promise<string> {
  const s3Client = getS3Client()
  const params = {
    Bucket: getBucketName(),
    Key: key,
    Expires: 3600, // 1 hour
  }
  
  return s3Client.getSignedUrl('getObject', params)
}

/**
 * Generate unique filename
 */
export function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const extension = originalName.split('.').pop() || 'jpg'
  return `${timestamp}-${random}.${extension}`
}
