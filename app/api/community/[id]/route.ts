import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const mapEnumToType = (enumVal: string) => enumVal.toLowerCase()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, location: true } },
        replies: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

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
      repliesList: post.replies.map((r) => ({
        id: r.id,
        author: r.author.name || "Unknown",
        authorId: r.authorId,
        avatar: r.author.avatar,
        content: r.content,
        isExpert: r.isExpert,
        createdAt: r.createdAt
      }))
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error("Error fetching community post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}


