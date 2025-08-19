import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if user already liked this post
    const existingLike = await prisma.communityPostLike.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike: remove the like and decrease count
      await prisma.communityPostLike.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId: postId
          }
        }
      })

      await prisma.communityPost.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false, message: "Post unliked" })
    } else {
      // Like: add the like and increase count
      await prisma.communityPostLike.create({
        data: {
          userId: user.id,
          postId: postId
        }
      })

      await prisma.communityPost.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })

      return NextResponse.json({ liked: true, message: "Post liked" })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if user has liked this post
    const existingLike = await prisma.communityPostLike.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    })

    return NextResponse.json({ liked: !!existingLike })
  } catch (error) {
    console.error("Error checking like status:", error)
    return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
  }
}
