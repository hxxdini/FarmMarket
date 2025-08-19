import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    // Get the reply to check ownership
    const reply = await prisma.communityReply.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    // Check if user is the author
    if (reply.author.email !== session.user.email) {
      return NextResponse.json({ error: "You can only edit your own replies" }, { status: 403 })
    }

    // Update the reply
    const updatedReply = await prisma.communityReply.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ reply: updatedReply })
  } catch (error) {
    console.error("Error updating community reply:", error)
    return NextResponse.json({ error: "Failed to update reply" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the reply to check ownership
    const reply = await prisma.communityReply.findUnique({
      where: { id },
      include: { author: true }
    })

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }

    // Check if user is the author
    if (reply.author.email !== session.user.email) {
      return NextResponse.json({ error: "You can only delete your own replies" }, { status: 403 })
    }

    // Delete the reply (this will cascade delete nested replies and likes)
    await prisma.communityReply.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Reply deleted successfully" })
  } catch (error) {
    console.error("Error deleting community reply:", error)
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 })
  }
}
