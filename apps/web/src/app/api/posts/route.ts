import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import { prisma } from '@fire/db'

// GET /api/posts - Get all posts (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    // Check user's reactions to these posts
    const userReactions = await prisma.postLike.findMany({
      where: {
        userId: session.user.id,
        postId: { in: posts.map((p) => p.id) },
      },
      select: { postId: true, isLike: true },
    })

    const reactionMap = new Map(userReactions.map((r) => [r.postId, r.isLike ? 'like' : 'dislike']))

    // Add user reaction to each post
    const postsWithReactions = posts.map((post) => ({
      ...post,
      userReaction: reactionMap.get(post.id) || null, // 'like', 'dislike', or null
    }))

    return NextResponse.json({ posts: postsWithReactions })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { content, images, videos, linkUrl, linkTitle, linkDescription, linkImage } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        content: content.trim(),
        images: images || [],
        videos: videos || [],
        linkUrl: linkUrl || null,
        linkTitle: linkTitle || null,
        linkDescription: linkDescription || null,
        linkImage: linkImage || null,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// DELETE /api/posts/[postId] - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
