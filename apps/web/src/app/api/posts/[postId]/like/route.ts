import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// POST /api/posts/[postId]/like - Like or dislike a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const isLike = body.isLike ?? true // Default to like if not specified

    // Check if already reacted
    const existing = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      // If same reaction, do nothing
      if (existing.isLike === isLike) {
        return NextResponse.json({ error: 'Already reacted' }, { status: 400 })
      }

      // Switching from like to dislike or vice versa
      await prisma.$transaction([
        prisma.postLike.update({
          where: { id: existing.id },
          data: { isLike },
        }),
        prisma.post.update({
          where: { id: postId },
          data: existing.isLike
            ? { likes: { decrement: 1 }, dislikes: { increment: 1 } } // Was like, now dislike
            : { dislikes: { decrement: 1 }, likes: { increment: 1 } }, // Was dislike, now like
        }),
      ])

      return NextResponse.json({ success: true, reaction: isLike ? 'like' : 'dislike' })
    }

    // New reaction - create it and increment counter
    await prisma.$transaction([
      prisma.postLike.create({
        data: {
          postId: postId,
          userId: session.user.id,
          isLike,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: isLike ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, reaction: isLike ? 'like' : 'dislike' })
  } catch (error) {
    console.error('Error reacting to post:', error)
    return NextResponse.json({ error: 'Failed to react to post' }, { status: 500 })
  }
}

// DELETE /api/posts/[postId]/like - Remove reaction from a post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user reacted
    const existing = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'No reaction found' }, { status: 400 })
    }

    // Delete reaction and decrement appropriate counter
    await prisma.$transaction([
      prisma.postLike.delete({
        where: { id: existing.id },
      }),
      prisma.post.update({
        where: { id: postId },
        data: existing.isLike ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, reaction: null })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
  }
}
