import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

const mapEnumToType = (enumVal: string) => enumVal.toLowerCase()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, location: true } },
        replies: {
          include: { 
            author: { select: { id: true, name: true, avatar: true } },
            replies: {
              include: { author: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Filter to only include top-level replies (where replyToId is null)
    const topLevelReplies = post.replies.filter(reply => reply.replyToId === null)

    // Get user's like status for replies if authenticated
    let userReplyLikes: string[] = []
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      
      if (user) {
        const replyIds = [
          ...topLevelReplies.map(r => r.id),
          ...topLevelReplies.flatMap(r => r.replies.map(nr => nr.id))
        ]
        
        if (replyIds.length > 0) {
          const userLikes = await prisma.communityReplyLike.findMany({
            where: {
              userId: user.id,
              replyId: { in: replyIds }
            },
            select: { replyId: true }
          })
          userReplyLikes = userLikes.map(like => like.replyId)
        }
      }
    }

    const data = {
      id: post.id,
      type: mapEnumToType(post.type),
      title: post.title,
      author: post.author.name || "Unknown",
      authorId: post.authorId,
      authorAvatar: post.author.avatar,
      content: post.content,
      category: post.category,
      crop: post.crop,
      location: post.location,
      replies: post.replies.length,
      likes: post.likes,
      createdAt: post.createdAt,
      hasExpertReply: post.replies.some((r) => r.isExpert),
      currentUserId: session?.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id : null,
      repliesList: topLevelReplies.map((r) => ({
        id: r.id,
        author: r.author.name || "Unknown",
        authorId: r.authorId,
        avatar: r.author.avatar,
        content: r.content,
        isExpert: r.isExpert,
        likes: r.likes,
        isLiked: userReplyLikes.includes(r.id),
        replyToId: r.replyToId,
        createdAt: r.createdAt,
        replies: r.replies.map((nestedReply) => ({
          id: nestedReply.id,
          author: nestedReply.author.name || "Unknown",
          authorId: nestedReply.authorId,
          avatar: nestedReply.author.avatar,
          content: nestedReply.content,
          isExpert: nestedReply.isExpert,
          likes: nestedReply.likes,
          isLiked: userReplyLikes.includes(nestedReply.id),
          replyToId: nestedReply.replyToId,
          createdAt: nestedReply.createdAt
        }))
      }))
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error("Error fetching community post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { title, content, category, crop } = await request.json()

    // Get the post to check ownership
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user is the author
    if (post.author.email !== session.user.email) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 })
    }

    // Update the post
    const updatedPost = await prisma.communityPost.update({
      where: { id },
      data: {
        title,
        content,
        category,
        crop,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("Error updating community post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the post to check ownership
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user is the author
    if (post.author.email !== session.user.email) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 })
    }

    // Delete the post (this will cascade delete replies and likes)
    await prisma.communityPost.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting community post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}


