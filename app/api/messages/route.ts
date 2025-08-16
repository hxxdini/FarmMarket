import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// POST /api/messages - Send a new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { conversationId, content, messageType = 'TEXT', attachmentUrl, attachmentType, replyToId } = body

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "Conversation ID and content are required" }, { status: 400 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 })
    }

    // Determine receiver
    const receiverId = conversation.user1Id === user.id ? conversation.user2Id : conversation.user1Id

    // Verify reply-to message exists if provided
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId
        }
      })

      if (!replyToMessage) {
        return NextResponse.json({ error: "Reply-to message not found" }, { status: 404 })
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: user.id,
        receiverId,
        content: content.trim(),
        messageType,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        replyToId: replyToId || null,
        status: 'SENT',
        createdAt: new Date(),
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

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      }
    })

    // TODO: Emit WebSocket event for real-time messaging
    // This will be implemented when we add WebSocket support

    return NextResponse.json({ 
      message: "Message sent successfully",
      data: message
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
