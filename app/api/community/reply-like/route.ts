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
    const { replyId } = body

    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 })
    }

    // Check if user already liked this reply
    const existingLike = await prisma.communityReplyLike.findUnique({
      where: {
        userId_replyId: {
          userId: user.id,
          replyId: replyId
        }
      }
    })

    if (existingLike) {
      // Unlike: remove the like and decrease count
      await prisma.communityReplyLike.delete({
        where: {
          userId_replyId: {
            userId: user.id,
            replyId: replyId
          }
        }
      })

      await prisma.communityReply.update({
        where: { id: replyId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false, message: "Reply unliked" })
    } else {
      // Like: add the like and increase count
      await prisma.communityReplyLike.create({
        data: {
          userId: user.id,
          replyId: replyId
        }
      })

      await prisma.communityReply.update({
        where: { id: replyId },
        data: { likes: { increment: 1 } }
      })

      return NextResponse.json({ liked: true, message: "Reply liked" })
    }
  } catch (error) {
    console.error("Error toggling reply like:", error)
    return NextResponse.json({ error: "Failed to toggle reply like" }, { status: 500 })
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
    const replyId = searchParams.get("replyId")

    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 })
    }

    // Check if user has liked this reply
    const existingLike = await prisma.communityReplyLike.findUnique({
      where: {
        userId_replyId: {
          userId: user.id,
          replyId: replyId
        }
      }
    })

    return NextResponse.json({ liked: !!existingLike })
  } catch (error) {
    console.error("Error checking reply like status:", error)
    return NextResponse.json({ error: "Failed to check reply like status" }, { status: 500 })
  }
}
