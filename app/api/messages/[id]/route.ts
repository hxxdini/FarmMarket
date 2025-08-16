import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// PUT /api/messages/[id] - Edit a message
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        senderId: user.id
      },
      include: {
        Conversation_Message_conversationIdToConversation: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
    }

    // Check if message is too old to edit (e.g., 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (message.createdAt < twentyFourHoursAgo) {
      return NextResponse.json({ error: "Message is too old to edit" }, { status: 400 })
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        Message: {
          select: {
            id: true,
            content: true,
            User_Message_senderIdToUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // TODO: Emit WebSocket event for real-time message update

    return NextResponse.json({ 
      message: "Message updated successfully",
      data: updatedMessage
    })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        senderId: user.id
      },
      include: {
        Conversation_Message_conversationIdToConversation: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
    }

    // Check if message is too old to delete (e.g., 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (message.createdAt < twentyFourHoursAgo) {
      return NextResponse.json({ error: "Message is too old to delete" }, { status: 400 })
    }

    // Check if this is the last message in conversation
    const isLastMessage = message.Conversation_Message_conversationIdToConversation.lastMessageId === message.id

    // Delete the message
    await prisma.message.delete({
      where: { id }
    })

    // If this was the last message, update conversation's last message
    if (isLastMessage) {
      const newLastMessage = await prisma.message.findFirst({
        where: { conversationId: message.conversationId },
        orderBy: { createdAt: 'desc' }
      })

      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          lastMessageId: newLastMessage?.id || null,
          lastMessageAt: newLastMessage?.createdAt || message.Conversation_Message_conversationIdToConversation.createdAt,
          updatedAt: new Date()
        }
      })
    }

    // TODO: Emit WebSocket event for real-time message deletion

    return NextResponse.json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/messages/[id] - Mark message as read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { status } = body

    if (!status || !['DELIVERED', 'READ'].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the message and verify user is the receiver
    const message = await prisma.message.findFirst({
      where: {
        id,
        receiverId: user.id
      }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
    }

    // Update message status
    const updateData: any = { 
      status,
      updatedAt: new Date()
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    } else if (status === 'READ') {
      updateData.readAt = new Date()
      updateData.deliveredAt = updateData.deliveredAt || new Date()
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: updateData
    })

    // TODO: Emit WebSocket event for real-time status update

    return NextResponse.json({ 
      message: "Message status updated successfully",
      data: updatedMessage
    })
  } catch (error) {
    console.error('Error updating message status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
