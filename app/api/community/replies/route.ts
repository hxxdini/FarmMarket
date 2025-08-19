import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { emitCommunityReplyCreated } from "@/lib/socket"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 })

    const replies = await prisma.communityReply.findMany({
      where: { postId },
      include: { 
        author: { select: { id: true, name: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "asc" },
    })

    const data = replies.map((r) => ({
      id: r.id,
      postId: r.postId,
      author: r.author.name || "Unknown",
      authorId: r.authorId,
      avatar: r.author.avatar,
      content: r.content,
      isExpert: r.isExpert,
      likes: r.likes,
      replyToId: r.replyToId,
      createdAt: r.createdAt,
      replies: r.replies.map((subReply) => ({
        id: subReply.id,
        postId: subReply.postId,
        author: subReply.author.name || "Unknown",
        authorId: subReply.authorId,
        avatar: subReply.author.avatar,
        content: subReply.content,
        isExpert: subReply.isExpert,
        likes: subReply.likes,
        replyToId: subReply.replyToId,
        createdAt: subReply.createdAt,
      }))
    }))

    return NextResponse.json({ replies: data })
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { Role: true, ExpertProfile: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { postId, content, replyToId } = body || {}
    if (!postId || !content) {
      return NextResponse.json({ error: "postId and content are required" }, { status: 400 })
    }

    // Expert flag if user has a verified ExpertProfile
    const isExpert = !!user.ExpertProfile && user.ExpertProfile.isVerified === true

    const reply = await prisma.communityReply.create({
      data: {
        id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        postId,
        authorId: user.id,
        content: content.trim(),
        replyToId: replyToId || null,
        isExpert,
        updatedAt: new Date(),
      },
      include: { 
        author: { select: { id: true, name: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
    })

    // Update post reply count and expert flag if needed
    await prisma.communityPost.update({
      where: { id: postId },
      data: { repliesCount: { increment: 1 } },
    })

    // Increment expert responses count if applicable
    if (isExpert) {
      await prisma.expertProfile.updateMany({
        where: { userId: user.id },
        data: { responses: { increment: 1 }, updatedAt: new Date() }
      })
    }

    try { emitCommunityReplyCreated(reply.id, reply.postId) } catch {}

    return NextResponse.json({
      reply: {
        id: reply.id,
        postId: reply.postId,
        author: reply.author.name || "Unknown",
        authorId: reply.authorId,
        avatar: reply.author.avatar,
        content: reply.content,
        isExpert: reply.isExpert,
        likes: reply.likes,
        replyToId: reply.replyToId,
        createdAt: reply.createdAt,
        replies: reply.replies.map((subReply) => ({
          id: subReply.id,
          postId: subReply.postId,
          author: subReply.author.name || "Unknown",
          authorId: subReply.authorId,
          avatar: subReply.author.avatar,
          content: subReply.content,
          isExpert: subReply.isExpert,
          likes: subReply.likes,
          replyToId: subReply.replyToId,
          createdAt: subReply.createdAt,
        }))
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating reply:", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}


